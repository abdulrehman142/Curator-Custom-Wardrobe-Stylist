# Wardrobe AI – FastAPI + Next.js + MLflow + DVC

Production-minded wardrobe recommendation stack with secure secret handling, experiment tracking (MLflow), and data/versioned pipelines (DVC).

## What’s inside
- **Backend**: FastAPI + YOLO classifier + Siamese compatibility model
- **Frontend**: Next.js (App Router) + Tailwind
- **MLOps**: MLflow tracking/registry, DVC pipelines, MinIO-compatible artifact store via Compose

## Prereqs
- Python 3.10+
- Node 18+
- Docker + Docker Compose (optional, recommended)

## Environment variables (no secrets in repo)
Set these locally (shell) or in non-committed `.env` files:

**Backend**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (default: `eu-north-1`)
- `S3_BUCKET` (default: `my-app-uploads-mlops`)
- `OPENWEATHER_API_KEY`
- `MLFLOW_TRACKING_URI` (default: `backend/mlruns` or `http://mlflow:5000` in Compose)
- `MLFLOW_MODEL_NAME` (default: `wardrobe-compatibility`)
- `MLFLOW_MODEL_STAGE` (default: `Production`)
- `YOLO_CLASSIFIER_PATH` (default: `backend/weights/best.pt`)

**Frontend**
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
- `NEXT_PUBLIC_OPENWEATHER_KEY` (frontend-safe OpenWeather key)

> Secrets must live in environment only. `.env` / `.env.local` are git-ignored.

## Local dev
Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Docker Compose (full stack)
```bash
docker compose up --build
```
Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MLflow UI: http://localhost:5000
- MinIO: http://localhost:9000

## MLflow
- Registry model: `wardrobe-compatibility`
- Hot-reload model: `POST /reload-model` (falls back to local checkpoint)

## DVC pipelines (backend/dvc.yaml)
- `preprocess`: resize wardrobe images → `backend/data/preprocessed`
- `train_siamese`: train compatibility model, log to MLflow, update registry
- `evaluate`: evaluate checkpoint, log metrics → `backend/reports/eval.json`
- Reproduce: `cd backend && dvc repro` (or `./run_pipeline.sh`)

## Data & models
- YOLO weights: `backend/weights/best.pt` (not tracked by git)
- Siamese model checkpoint: `backend/models/compat_mobilenetv2.pth` (tracked via DVC)
- User uploads: `backend/uploads` (tracked via DVC)

## Safety checklist before pushing
- Ensure `.env`, `.env.local`, `backend/.env`, `frontend/.env.local` stay untracked (already in `.gitignore`).
- Do **not** commit keys; set env vars instead.
- Optional scan: `gitleaks detect --redact`.

## Useful scripts
- `backend/mlflow_server.sh` – local MLflow server
- `backend/ml/siamese_train.py` – train & log compatibility model
- `backend/ml/preprocess.py` – image preprocessing
- `run_pipeline.sh` – DVC pipeline wrapper

