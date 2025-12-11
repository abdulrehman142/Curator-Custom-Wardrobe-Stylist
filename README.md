# Wardrobe AI – MLOps (MLflow + DVC)

This repo powers the Wardrobe AI app (FastAPI backend + Next.js frontend) with
MLflow tracking/registry and DVC data/pipeline reproducibility.

## Quick start

- Backend API: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm install && npm run dev`

## MLflow (tracking + registry)

- Start local server: `cd backend && ./mlflow_server.sh` (or `mlflow_server.bat`)
- UI: http://localhost:5000
- Configure client: `export MLFLOW_TRACKING_URI=http://localhost:5000`
- Model registry name: `wardrobe-compatibility`
- API hot reload: `POST /reload-model` (FastAPI) to pull the latest registry model
  with fallback to `backend/models/compat_mobilenetv2.pth`.

## DVC (data + pipelines)

- Init (already done): `dvc init --no-scm`
- Data tracked: `backend/uploads`, `backend/models`, `backend/weights`, `backend/wardrobe.db`
- Pipelines (in `backend/dvc.yaml`):
  - `preprocess`: resize wardrobe images → `backend/data/preprocessed`
  - `train_siamese`: trains compatibility model, logs to MLflow, updates registry
  - `evaluate`: evaluates checkpoint, logs metrics to MLflow → `backend/reports/eval.json`
- Reproduce all stages: `./run_pipeline.sh` (or `run_pipeline.bat` on Windows) – runs `dvc repro` from backend

## Key scripts

- `backend/ml/preprocess.py` – cleans & resizes images
- `backend/ml/siamese_train.py` – trains + logs compatibility model to MLflow & registry
- `backend/ml/evaluate.py` – evaluates model and logs metrics/artifacts
- `backend/mlflow_server.(sh|bat)` – local MLflow server helper
- `run_pipeline.sh` – pipeline wrapper (DVC + registry update)

## Environment variables

- `MLFLOW_TRACKING_URI` (default: `backend/mlruns`)
- `MLFLOW_MODEL_NAME` (default: `wardrobe-compatibility`)
- `MLFLOW_MODEL_STAGE` (default: `Production`)
- `YOLO_CLASSIFIER_PATH` (default: `backend/weights/best.pt`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

## Running with Docker Compose

- Build all images:
  ```
  docker compose build
  ```
- Start the stack:
  ```
  docker compose up
  ```
- Services:
  - Frontend: http://localhost:3000
  - Backend: http://localhost:8000
  - MLflow UI: http://localhost:5000

