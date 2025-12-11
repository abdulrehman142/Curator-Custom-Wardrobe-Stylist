#!/usr/bin/env bash
set -euo pipefail

# Start a local MLflow tracking server + registry backed by SQLite.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

BACKEND_STORE_URI="sqlite:///$(pwd)/mlflow.db"
ARTIFACT_ROOT="${MLFLOW_ARTIFACT_ROOT:-$(pwd)/mlruns}"
export MLFLOW_TRACKING_URI="${MLFLOW_TRACKING_URI:-http://localhost:5000}"

echo "Starting MLflow server"
echo " - Backend store: ${BACKEND_STORE_URI}"
echo " - Artifact root: ${ARTIFACT_ROOT}"
echo " - Tracking URI:  ${MLFLOW_TRACKING_URI}"

mlflow server \
  --backend-store-uri "${BACKEND_STORE_URI}" \
  --default-artifact-root "${ARTIFACT_ROOT}" \
  --host 0.0.0.0 \
  --port 5000

