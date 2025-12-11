import argparse
import os
from pathlib import Path
from typing import Dict, Tuple

import yaml
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_PARAMS = BASE_DIR / "params.yaml"


def load_params(params_file: Path) -> Dict:
    with open(params_file, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def preprocess_image(src_path: Path, dst_path: Path, image_size: Tuple[int, int]) -> None:
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src_path).convert("RGB") as img:
        img = img.resize(image_size)
        img.save(dst_path, format="PNG", optimize=True)


def run(params: Dict) -> Dict:
    cfg = params.get("preprocess", {})
    input_dir = BASE_DIR / cfg.get("input_dir", "uploads")
    output_dir = BASE_DIR / cfg.get("output_dir", "data/preprocessed")
    image_size = int(cfg.get("image_size", 224))

    processed = 0
    skipped = 0

    for src_path in input_dir.rglob("*"):
        if src_path.is_dir():
            continue
        if src_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            skipped += 1
            continue

        relative = src_path.relative_to(input_dir)
        dst_path = output_dir / relative.with_suffix(".png")
        try:
            preprocess_image(src_path, dst_path, (image_size, image_size))
            processed += 1
        except Exception:
            skipped += 1

    summary = {
        "processed": processed,
        "skipped": skipped,
        "output_dir": str(output_dir),
        "image_size": image_size,
    }
    return summary


def main():
    parser = argparse.ArgumentParser(description="Preprocess wardrobe images.")
    parser.add_argument(
        "--params-file",
        type=Path,
        default=DEFAULT_PARAMS,
        help="Path to params.yaml",
    )
    args = parser.parse_args()

    params = load_params(args.params_file)
    summary = run(params)

    print(f"Preprocessing complete: {summary}")


if __name__ == "__main__":
    main()

