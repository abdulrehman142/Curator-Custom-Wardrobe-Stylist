@echo off
setlocal

REM Reproduce the full DVC pipeline and push the model to MLflow registry.
set SCRIPT_DIR=%~dp0
pushd %SCRIPT_DIR%\backend

if "%MLFLOW_TRACKING_URI%"=="" (
  set MLFLOW_TRACKING_URI=%CD%\mlruns
)

echo Running DVC pipeline with tracking URI: %MLFLOW_TRACKING_URI%
dvc repro

echo Pipeline complete. Call POST /reload-model on the API to load the latest registry model.

popd
endlocal

