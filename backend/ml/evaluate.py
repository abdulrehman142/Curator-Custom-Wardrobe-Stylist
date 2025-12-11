import argparse
import json
import logging
import os
from pathlib import Path
from typing import Dict

import mlflow
import torch
import yaml

from app.outfit_compatibility import OutfitCompatibilityModel
from ml.siamese_train import PairDataset
from app.dependencies import get_tracking_uri, get_s3_endpoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("siamese_evaluate")

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_PARAMS = BASE_DIR / "params.yaml"
DEFAULT_REPORT = BASE_DIR / "reports" / "eval.json"


def load_params(params_file: Path) -> Dict:
    with open(params_file, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def evaluate_model(params: Dict, checkpoint_path: Path, report_path: Path) -> Dict:
    eval_cfg = params.get("evaluate", {})
    preprocess_cfg = params.get("preprocess", {})

    num_pairs = int(eval_cfg.get("num_pairs", 32))
    batch_size = int(eval_cfg.get("batch_size", 8))
    image_size = int(preprocess_cfg.get("image_size", 224))
    preprocessed_dir = BASE_DIR / preprocess_cfg.get("output_dir", "data/preprocessed")

    dataset = PairDataset(preprocessed_dir, image_size=image_size)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model_wrapper = OutfitCompatibilityModel(model_path=str(checkpoint_path))
    model = model_wrapper.model

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    correct = 0
    total = 0
    scores_sum = 0.0

    with torch.no_grad():
        for step, (img1, img2, labels) in enumerate(dataloader):
            if total >= num_pairs:
                break
            img1, img2, labels = img1.to(device), img2.to(device), labels.to(device)
            outputs, _, _ = model(img1, img2)
            preds = (outputs > 0.5).float()
            correct += (preds == labels).sum().item()
            scores_sum += outputs.sum().item()
            total += labels.numel()

    accuracy = correct / max(total, 1)
    mean_score = scores_sum / max(total, 1)

    metrics = {
        "accuracy": accuracy,
        "mean_score": mean_score,
        "evaluated_pairs": total,
        "checkpoint": str(checkpoint_path),
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate Siamese compatibility model.")
    parser.add_argument(
        "--params-file",
        type=Path,
        default=DEFAULT_PARAMS,
        help="Path to params.yaml",
    )
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=BASE_DIR / "models" / "compat_mobilenetv2.pth",
        help="Checkpoint to evaluate.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT,
        help="Where to save evaluation metrics JSON.",
    )
    args = parser.parse_args()

    params = load_params(args.params_file)
    tracking_uri = get_tracking_uri()
    s3_endpoint = get_s3_endpoint()
    if s3_endpoint:
        os.environ["MLFLOW_S3_ENDPOINT_URL"] = s3_endpoint

    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(params.get("train_siamese", {}).get("experiment_name", "wardrobe-compatibility"))

    with mlflow.start_run(run_name="siamese-evaluate"):
        metrics = evaluate_model(params, args.checkpoint, args.report)
        mlflow.log_metrics(metrics)
        mlflow.log_artifact(str(args.report), artifact_path="reports")
        logger.info("Evaluation metrics: %s", metrics)


if __name__ == "__main__":
    main()

