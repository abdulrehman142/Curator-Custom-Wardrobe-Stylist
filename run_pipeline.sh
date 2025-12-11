#!/usr/bin/env bash
set -euo pipefail

# Reproduce the full DVC pipeline and push the resulting model to MLflow.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_ROOT}/backend"

export MLFLOW_TRACKING_URI="${MLFLOW_TRACKING_URI:-${PROJECT_ROOT}/backend/mlruns}"

echo "Running DVC pipeline with tracking URI: ${MLFLOW_TRACKING_URI}"
dvc repro

echo "Pipeline complete. The latest compatibility model has been logged to MLflow."
echo "If the API is running, call POST /reload-model to pull the newest registry version."

