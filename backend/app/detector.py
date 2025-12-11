# app/detector.py
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

# path to your classifier weights
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)  # Go up to backend/
MODEL_PATH = os.environ.get("YOLO_CLASSIFIER_PATH", os.path.join(BACKEND_DIR, "weights", "best.pt"))

# Lazy-load YOLO model to avoid blocking app startup
_yolo_model = None

def _get_yolo_model():
    global _yolo_model
    if _yolo_model is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"YOLO classifier model not found at: {MODEL_PATH}. "
                f"Set YOLO_CLASSIFIER_PATH or place best.pt in backend/weights/"
            )
        _yolo_model = YOLO(MODEL_PATH)
        logger.info(f"Loaded YOLO model from {MODEL_PATH}")
        try:
            print("Loaded model from:", MODEL_PATH)
            print("Classes:", _yolo_model.names)
        except Exception:
            pass
    return _yolo_model

def classify_image_bytes(image_bytes, topk=1):
    """
    Returns list of predictions: [{"class_name": str, "confidence": float}]
    Compatible with older Ultralytics YOLO where Probs has no .topk().
    """
    # Load image
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return [{"class_name": "corrupt_image", "confidence": 0.0, "reason": str(e)}]

    try:
        model = _get_yolo_model()
        results = model.predict(img, save=False, verbose=False)
        r = results[0]

        # ------------------------------
        # CASE A — Classification Output
        # ------------------------------
        if hasattr(r, "probs") and r.probs is not None:
            probs = r.probs

            # If topk == 1 → Use top1
            if topk == 1:
                idx = int(probs.top1)
                conf = float(probs.top1conf)
                return [{
                    "class_name": model.names[idx],
                    "confidence": conf
                }]

            # If topk > 1 → Use top5
            indices = probs.top5[:topk]
            confs = probs.top5conf[:topk]

            preds = []
            for idx, conf in zip(indices, confs):
                preds.append({
                    "class_name": model.names[int(idx)],
                    "confidence": float(conf)
                })
            return preds

        # ------------------------------
        # CASE B — Detection fallback
        # ------------------------------
        if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
            preds = []
            for b in r.boxes:
                cls_id = int(b.cls)
                preds.append({
                    "class_name": model.names[cls_id],
                    "confidence": float(b.conf)
                })
            preds = sorted(preds, key=lambda x: x["confidence"], reverse=True)
            return preds[:topk]

        return [{"class_name": "unknown", "confidence": 0.0, "reason": "no classes available"}]

    except Exception as e:
        return [{"class_name": "unknown", "confidence": 0.0, "reason": str(e)}]

