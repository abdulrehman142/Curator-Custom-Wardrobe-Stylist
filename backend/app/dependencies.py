import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

import mlflow
from mlflow.tracking import MlflowClient

# Base directory for the backend package
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _normalize_tracking_uri(uri: str) -> str:
    """
    Ensure a local filesystem URI includes the file:// scheme so the MLflow
    registry client accepts it.
    """
    parsed = urlparse(uri)
    if parsed.scheme:  # already has a scheme
        return uri

    # Treat as local path
    abs_path = Path(uri).resolve()
    return abs_path.as_uri()


@lru_cache()
def get_tracking_uri() -> str:
    """
    Resolve the MLflow tracking URI from the environment or default to a local
    mlruns directory inside the backend. Normalizes local paths to file:// URIs.
    """
    raw = os.environ.get("MLFLOW_TRACKING_URI", os.path.join(BASE_DIR, "mlruns"))
    return _normalize_tracking_uri(raw)


@lru_cache()
def get_registry_model_name() -> str:
    """Default MLflow Model Registry name for the compatibility model."""
    return os.environ.get("MLFLOW_MODEL_NAME", "wardrobe-compatibility")


@lru_cache()
def get_registry_stage() -> str:
    """
    Default stage used when pulling from the Model Registry. Fallback is
    Production, but allows overriding for testing.
    """
    return os.environ.get("MLFLOW_MODEL_STAGE", "Production")


@lru_cache()
def get_s3_endpoint() -> str:
    """
    Optional S3-compatible artifact endpoint for future remote storage.
    Exposed so training scripts can configure the MLflow client consistently.
    """
    return os.environ.get("MLFLOW_S3_ENDPOINT_URL", "")


@lru_cache()
def get_mlflow_client() -> MlflowClient:
    """
    Provide a cached MlflowClient configured with the resolved tracking URI.
    Using a cached instance avoids repeated network configuration overhead.
    """
    tracking_uri = get_tracking_uri()
    mlflow.set_tracking_uri(tracking_uri)
    return MlflowClient(tracking_uri=tracking_uri)

