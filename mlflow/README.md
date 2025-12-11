# MLflow for Wardrobe AI

This folder contains local MLflow configuration helpers for Wardrobe AI.

## Quick start (local)

1. Ensure dependencies are installed:
   ```
   pip install -r backend/requirements.txt
   ```
2. Start the MLflow UI + registry (uses SQLite + local artifacts):
   ```
   cd backend
   ./mlflow_server.sh         # or mlflow_server.bat on Windows
   ```
3. Open the UI at http://localhost:5000 and set your client to the same URI:
   ```
   export MLFLOW_TRACKING_URI=http://localhost:5000
   ```

## Defaults

- Tracking URI: `mlruns` (local file store) unless `MLFLOW_TRACKING_URI` is set.
- Registry model name: `wardrobe-compatibility` (override with `MLFLOW_MODEL_NAME`).
- Preferred stage: `Production` (override with `MLFLOW_MODEL_STAGE`).

## Notes

- Training and evaluation scripts in `backend/ml/` log params, metrics, artifacts,
  and push models to the registry automatically.
- The API runtime in `backend/app/outfit_compatibility.py` will try to pull from
  the registry first, then fall back to `backend/models/compat_mobilenetv2.pth`.

