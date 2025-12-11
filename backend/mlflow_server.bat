@echo off
setlocal enabledelayedexpansion

REM Start a local MLflow tracking server + registry (SQLite + local artifacts)
set SCRIPT_DIR=%~dp0
pushd %SCRIPT_DIR%

set BACKEND_STORE_URI=sqlite:///%CD%/mlflow.db
if "%MLFLOW_ARTIFACT_ROOT%"=="" (
  set ARTIFACT_ROOT=%CD%/mlruns
) else (
  set ARTIFACT_ROOT=%MLFLOW_ARTIFACT_ROOT%
)

if "%MLFLOW_TRACKING_URI%"=="" (
  set MLFLOW_TRACKING_URI=http://localhost:5000
)

echo Starting MLflow server
echo  - Backend store: %BACKEND_STORE_URI%
echo  - Artifact root: %ARTIFACT_ROOT%
echo  - Tracking URI:  %MLFLOW_TRACKING_URI%

mlflow server ^
  --backend-store-uri "%BACKEND_STORE_URI%" ^
  --default-artifact-root "%ARTIFACT_ROOT%" ^
  --host 0.0.0.0 ^
  --port 5000

popd
endlocal

