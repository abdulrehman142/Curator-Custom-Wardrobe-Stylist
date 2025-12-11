# Wardrobe AI - Backend

FastAPI backend for the Wardrobe AI application.

## Structure

- `app/` - Python application code
- `uploads/` - Uploaded clothing images
- `wardrobe.db` - SQLite database
- `models/` - ML model checkpoints
- `mlruns/` - MLflow experiment tracking
- `weights/` - YOLO model weights

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

- `YOLO_CLASSIFIER_PATH` - Path to YOLO model weights (default: `app/weights/best.pt`)
- `NEXT_PUBLIC_API_URL` - API URL for frontend (default: `http://localhost:8000`)
- `MLFLOW_TRACKING_URI` - MLflow tracking URI (default: `backend/mlruns` file store)
- `MLFLOW_MODEL_NAME` - Registry model name (default: `wardrobe-compatibility`)
- `MLFLOW_MODEL_STAGE` - Preferred registry stage when loading (default: `Production`)

## MLOps

- Start MLflow locally: `./mlflow_server.sh` (or `mlflow_server.bat`) then open http://localhost:5000.
- Reload runtime model from registry: `POST /reload-model`.
- DVC pipeline (inside `backend`): `dvc repro` or project root `./run_pipeline.sh`.

## API Endpoints

- `POST /upload` - Upload and classify clothing items
- `GET /wardrobe` - Get all wardrobe items
- `GET /item/{item_id}` - Get specific item
- `GET /recommend` - Weather-based recommendations
- `POST /analyze-face` - Analyze face from photo
- `POST /face-recommendations` - Get face-based clothing recommendations
- `POST /outfit-recommendations` - Get outfit compatibility recommendations

