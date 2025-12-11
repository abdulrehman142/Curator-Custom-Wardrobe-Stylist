import argparse
import logging
import os
import random
from pathlib import Path
from typing import Dict, List, Tuple

import mlflow
from mlflow.tracking import MlflowClient
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
import yaml

from app.outfit_compatibility import SiameseMobileNetV2
from app.dependencies import (
    get_registry_model_name,
    get_registry_stage,
    get_tracking_uri,
    get_s3_endpoint,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("siamese_train")

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_PARAMS = BASE_DIR / "params.yaml"
RUNTIME_MODEL_PATH = BASE_DIR / "models" / "compat_mobilenetv2.pth"


class PairDataset(Dataset):
    """
    Lightweight dataset that generates pseudo labels for compatibility.
    In a real setting you would supply curated positive/negative pairs.
    """

    def __init__(self, image_dir: Path, image_size: int):
        self.image_paths: List[Path] = [
            p for p in image_dir.rglob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg"}
        ]
        if len(self.image_paths) < 2:
            raise ValueError("Need at least two images to form pairs.")

        self.transform = transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int):
        img1_path = self.image_paths[idx % len(self.image_paths)]
        img2_path = random.choice(self.image_paths)

        # Pseudo label: even indexes are positives, odd are negatives
        label = 1.0 if idx % 2 == 0 else 0.0

        with Image.open(img1_path).convert("RGB") as img1:
            with Image.open(img2_path).convert("RGB") as img2:
                return (
                    self.transform(img1),
                    self.transform(img2),
                    torch.tensor([label], dtype=torch.float32),
                )


def load_params(params_file: Path) -> Dict:
    with open(params_file, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def train(
    params: Dict,
    output_path: Path,
) -> Dict:
    train_cfg = params.get("train_siamese", {})
    image_size = int(params.get("preprocess", {}).get("image_size", 224))
    preprocessed_dir = BASE_DIR / params.get("preprocess", {}).get("output_dir", "data/preprocessed")

    batch_size = int(train_cfg.get("batch_size", 8))
    num_epochs = int(train_cfg.get("num_epochs", 2))
    lr = float(train_cfg.get("lr", 5e-4))
    embedding_dim = int(train_cfg.get("embedding_dim", 128))

    dataset = PairDataset(preprocessed_dir, image_size=image_size)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = SiameseMobileNetV2(embedding_dim=embedding_dim)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    criterion = nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    tracking_uri = get_tracking_uri()
    s3_endpoint = get_s3_endpoint()
    registry_model_name = get_registry_model_name()
    registry_stage = get_registry_stage()

    if s3_endpoint:
        os.environ["MLFLOW_S3_ENDPOINT_URL"] = s3_endpoint

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(train_cfg.get("experiment_name", "wardrobe-compatibility"))

    global_step = 0
    best_loss = float("inf")
    history: List[Tuple[int, float]] = []

    with mlflow.start_run(run_name="siamese-train") as run:
        mlflow.log_params(
            {
                "batch_size": batch_size,
                "num_epochs": num_epochs,
                "learning_rate": lr,
                "embedding_dim": embedding_dim,
                "image_size": image_size,
                "preprocessed_dir": str(preprocessed_dir),
            }
        )

        for epoch in range(num_epochs):
            running_loss = 0.0
            for img1, img2, labels in dataloader:
                img1, img2, labels = img1.to(device), img2.to(device), labels.to(device)

                optimizer.zero_grad()
                scores, _, _ = model(img1, img2)
                loss = criterion(scores, labels)
                loss.backward()
                optimizer.step()

                running_loss += loss.item()
                mlflow.log_metric("train_loss_step", loss.item(), step=global_step)
                global_step += 1

            epoch_loss = running_loss / max(len(dataloader), 1)
            history.append((epoch, epoch_loss))
            mlflow.log_metric("train_loss_epoch", epoch_loss, step=epoch)
            logger.info("Epoch %s: loss=%.4f", epoch + 1, epoch_loss)

            if epoch_loss < best_loss:
                best_loss = epoch_loss

        # Persist model artifacts
        output_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save({"model_state_dict": model.state_dict()}, output_path)
        mlflow.log_artifact(str(output_path), artifact_path="checkpoints")

        # Update runtime checkpoint for the API
        RUNTIME_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        torch.save({"model_state_dict": model.state_dict()}, RUNTIME_MODEL_PATH)

        # Log a full MLflow PyTorch model and push to registry
        model_info = mlflow.pytorch.log_model(
            pytorch_model=model,
            artifact_path="model",
            registered_model_name=registry_model_name,
        )

        # Transition to desired stage if configured
        try:
            client = MlflowClient(tracking_uri=tracking_uri)
            versions = client.search_model_versions(f"name='{registry_model_name}'")
            current_version = next(
                (v for v in versions if v.run_id == run.info.run_id), None
            )
            if current_version and registry_stage:
                client.transition_model_version_stage(
                    name=registry_model_name,
                    version=current_version.version,
                    stage=registry_stage,
                    archive_existing_versions=False,
                )
                logger.info(
                    "Registered model version %s transitioned to stage %s",
                    current_version.version,
                    registry_stage,
                )
        except Exception as exc:  # pragma: no cover - best-effort registry push
            logger.warning("Could not push model to registry: %s", exc)

    return {
        "best_loss": best_loss,
        "history": history,
        "output_path": str(output_path),
        "runtime_checkpoint": str(RUNTIME_MODEL_PATH),
        "tracking_uri": tracking_uri,
    }


def main():
    parser = argparse.ArgumentParser(description="Train Siamese compatibility model.")
    parser.add_argument(
        "--params-file",
        type=Path,
        default=DEFAULT_PARAMS,
        help="Path to params.yaml",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=BASE_DIR / "artifacts" / "compatibility" / "compat_mobilenetv2.pth",
        help="Where to write the trained checkpoint (DVC-tracked output).",
    )
    args = parser.parse_args()

    params = load_params(args.params_file)
    result = train(params, args.output_path)
    logger.info("Training complete: %s", result)


if __name__ == "__main__":
    main()

