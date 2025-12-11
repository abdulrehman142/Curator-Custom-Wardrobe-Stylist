# Curator Project: ML Infrastructure Summary

## 📊 Overview
This document summarizes the ML models, MLflow configuration, DVC setup, Docker infrastructure, and AWS integration used in the Curator wardrobe recommendation system.

---

## 🤖 Models Used in Project

### 1. **YOLO Classifier (Clothing Detection & Classification)**
- **Type**: Ultralytics YOLO (YOLOv8 or similar)
- **Purpose**: Classify clothing items into categories (e.g., tops, bottoms, dresses, etc.)
- **Location**: `/backend/weights/best.pt`
- **Framework**: PyTorch
- **Usage**:
  - Loaded in `backend/app/detector.py`
  - Function: `classify_image_bytes()` - returns class name and confidence
  - Used in API endpoint to classify uploaded clothing images

### 2. **Siamese Network (MobileNetV2)**
- **Type**: Siamese Neural Network with MobileNetV2 backbone
- **Purpose**: Learn outfit compatibility - determine if two clothing items work well together
- **Architecture**: 
  - Backbone: MobileNetV2 (pretrained ImageNet weights)
  - Feature extractor: MobileNetV2's feature layers (1280 output dims)
  - Embedding layer: Linear projection to 128-dimensional embedding space
  - Custom layers: Adaptive average pooling → Flatten → Linear layers with ReLU & Dropout
- **Configuration**:
  - Image size: 128×128 pixels
  - Embedding dimension: 128
  - Dropout: 0.2
- **Locations**:
  - Model definition: `backend/app/outfit_compatibility.py` (`SiameseMobileNetV2` class)
  - Trained weights: `backend/models/compat_mobilenetv2.pth`
  - Training script: `backend/ml/siamese_train.py`
- **Training Details**:
  - Uses `PairDataset` class for generating training pairs
  - Contrastive loss for Siamese training
  - Tracks training with MLflow

### 3. **Face Analyzer (OpenCV + Optional Dlib)**
- **Type**: Face detection & shape analysis
- **Purpose**: Detect face shape and recommend suitable clothing styles
- **Methods**:
  - **Primary**: OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`)
  - **Optional**: Dlib shape predictor (68 facial landmarks)
  - Falls back to basic face shape detection if Dlib unavailable
- **Location**: `backend/app/face_analyzer.py`
- **Classes**:
  - `FaceAnalyzer`: Detects faces and analyzes shape
  - `ClothingRecommender`: Recommends clothing based on face shape

---

## 🔄 MLflow - Experiment Tracking & Model Registry

### MLflow Setup
- **Tracking URI**: Configurable via `MLFLOW_TRACKING_URI` env var
  - Default: `backend/mlruns/` (local filesystem)
  - Docker: `http://mlflow:5000` (MLflow server container)
- **Model Registry**: Local SQLite or remote MLflow server
- **S3-Compatible Storage**: Optional via `MLFLOW_S3_ENDPOINT_URL`

### Key Configuration (backend/app/dependencies.py)
```python
# Environment variables used:
- MLFLOW_TRACKING_URI: MLflow server URL or local path
- MLFLOW_MODEL_NAME: "wardrobe-compatibility" (default)
- MLFLOW_MODEL_STAGE: "Production" (default)
- MLFLOW_S3_ENDPOINT_URL: S3-compatible endpoint (optional)
```

### Model Registry
- **Model Name**: `wardrobe-compatibility`
- **Registered Model Stage**: Production
- **Artifacts**: Stored in MLflow backend (local or S3)
- **Functions**:
  - `get_model()` - Load model from registry
  - `reload_model_from_registry()` - Refresh model from registry

---

## 📦 DVC (Data Version Control)

### DVC Configuration Files
- **`dvc.yaml`** - Pipeline stages and dependencies
- **`dvc.lock`** - Locked versions of all stages

### Tracked Artifacts (`.dvc` files)
- `models.dvc` - Trained model artifacts
- `weights.dvc` - YOLO classifier weights
- `uploads.dvc` - User uploaded images
- `wardrobe.db.dvc` - SQLite database

### DVC Pipeline Stages
```yaml
download:
  - Downloads raw data
  - Output: data/raw/

preprocess:
  - Preprocesses raw data
  - Output: data/preprocessed/

train:
  - Trains Siamese model
  - Outputs: models/
  - Metrics: metrics.json
```

### DVC Remote Storage
- Configured for S3-compatible storage (MinIO in Docker)
- Can push/pull artifacts for collaboration and CI/CD

---

## 🐳 Docker Infrastructure

### Services (docker-compose.yml)

#### **Backend Service**
```dockerfile
- Image: ./backend (built from Dockerfile)
- Port: 8000
- Framework: FastAPI + Uvicorn
- Dependencies: MLflow, Database
- Volumes:
  - ./backend/uploads → /app/uploads
  - ./backend/mlruns → /app/mlruns
  - ./backend/models → /app/models
- Env Vars:
  - MLFLOW_TRACKING_URI=http://mlflow:5000
  - MLFLOW_S3_ENDPOINT_URL=http://minio:9000
```

#### **Frontend Service**
```dockerfile
- Image: ./frontend (built from Dockerfile)
- Port: 3000
- Framework: Next.js
- Env Vars:
  - NEXT_PUBLIC_API_URL=http://backend:8000
```

#### **MLflow Service**
```dockerfile
- Image: ./mlflow (built from Dockerfile)
- Port: 5000
- Backend: SQLite (mlflow.db)
- Artifact Root: /mlflow
- Dependencies: MinIO for S3-compatible storage
```

#### **MinIO Service**
```docker
- Image: minio/minio
- Port: 9000
- Purpose: S3-compatible object storage
- Credentials: minio/minio123
- Bucket: mlflow (created by mc service)
```

#### **MinIO Client (mc) Service**
- Creates and configures MinIO bucket for MLflow artifacts

#### **Nginx Service**
```docker
- Image: nginx:stable-alpine
- Port: 80
- Configuration: ./deploy/nginx.conf
- Routes traffic to Frontend and Backend
```

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim
- System deps: OpenCV libraries, Chromium (for web scraping), CA certificates
- Python deps: Installed from requirements.txt
- Exposures: Port 8000
- Startup: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🌩️ AWS Integration

### AWS Services Used
1. **S3 Bucket**: `my-app-uploads-mlops`
   - Stores user uploads
   - Region: `eu-north-1` (configurable via `AWS_REGION` env var)

2. **IAM Credentials**
   - Access Key ID: `AKIASVY2NYCCLWS67DWH`
   - Secret Access Key: Stored in code (⚠️ **SECURITY WARNING** - see below)

### AWS Configuration in Backend
**Location**: `backend/app/main.py`
```python
S3_BUCKET = "my-app-uploads-mlops"
AWS_REGION = os.environ.get("AWS_REGION", "eu-north-1")
s3 = boto3.client("s3", aws_access_key_id="...", aws_secret_access_key="...")
```

### S3 API Endpoints
1. **POST /generate-presigned-url**
   - Generates presigned URL for secure S3 upload
   - Parameters: filename, content_type, expires_in
   - Returns: presigned URL, S3 key, expiration time

2. **POST /test-upload-s3**
   - Direct S3 upload endpoint for testing
   - Returns: S3 key and public URL

### Dependencies
- **boto3** (≥1.40.59) - AWS SDK
- **botocore** (≥1.40.59) - Boto core library
- **s3transfer** (≥0.14.0) - S3 transfer utilities
- **aiobotocore** (≥2.13.0) - Async AWS SDK

---

## 📋 Project Dependencies

### Core ML/AI Libraries
- **ultralytics** - YOLO object detection/classification
- **torch** - PyTorch deep learning framework
- **torchvision** - PyTorch vision models (MobileNetV2, etc.)
- **scikit-learn** (≥1.7) - KMeans for color clustering
- **opencv-python-headless** - Computer vision (face detection)
- **numpy** (<2.2) - Numerical computing
- **Pillow** (<12) - Image processing

### Data & Model Management
- **mlflow** - Experiment tracking and model registry
- **dvc** - Data version control
- **boto3** - AWS S3 integration

### Web Framework
- **fastapi** - Modern async web framework
- **uvicorn[standard]** - ASGI server
- **pydantic** - Data validation
- **python-multipart** - File upload handling

### Database
- **sqlalchemy** - ORM
- **databases** - Async database access

### Web Scraping
- **selenium** - Browser automation
- **beautifulsoup4** - HTML parsing
- **requests** - HTTP client

### Security & Auth
- **python-jose** (≥3.5.0) - JWT token handling
- **email-validator** - Email validation

### Optional
- **dlib** - Advanced facial landmark detection (optional)
- **webdriver-manager** - Auto-download ChromeDriver

---

## 🔐 Security Warnings

### ⚠️ CRITICAL: Exposed AWS Credentials
- AWS credentials are hardcoded in `backend/app/main.py`
- Credentials are visible in `AwsUserAccessKeys.txt`
- **RECOMMENDATION**: 
  - Immediately rotate these credentials
  - Use environment variables or AWS IAM roles
  - Store secrets in `.env` file (added to `.gitignore`)
  - Use AWS Secrets Manager in production

### ⚠️ Other Security Issues
- Database connection strings should use environment variables
- MLflow server should have authentication in production
- MinIO credentials hardcoded (minio/minio123)

---

## 📊 Data Flow

```
User Upload → FastAPI Backend → S3 (via boto3) & Local Storage
                    ↓
             YOLO Classifier
                    ↓
         Item Classification → Database
                    ↓
         Siamese Network (Compatibility Check)
                    ↓
      Outfit Recommendations → Frontend (Next.js)

MLflow Tracking:
Training → Experiment logs → MLflow server → Artifact storage (S3/MinIO)
         ↓
    Model Registry (Production stage)
         ↓
    Loaded at runtime for inference
```

---

## 🚀 Running the Project

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
mlflow server --backend-store-uri sqlite:///mlflow.db
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Deployment
```bash
docker-compose up -d
# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - MLflow: http://localhost:5000
# - MinIO: http://localhost:9000
```

---

## 📝 Model Training

### Siamese Network Training
```bash
python backend/ml/siamese_train.py \
  --data-dir backend/data/preprocessed \
  --output-dir backend/models \
  --params-file backend/params.yaml
```

### Training Parameters (params.yaml)
```yaml
train:
  batch_size: 8
  lr: 0.0001
  epochs: 3
  image_size: 128
```

### MLflow Integration in Training
- Logs metrics during training
- Registers model in registry
- Stores artifacts (weights, metadata)

---

## 🎯 Next Steps / Improvements

1. **Security**
   - [ ] Move AWS credentials to environment variables
   - [ ] Implement AWS IAM roles instead of hardcoded keys
   - [ ] Add authentication to MLflow server

2. **Model Improvements**
   - [ ] Collect more training data for Siamese network
   - [ ] Fine-tune YOLO model on custom dataset
   - [ ] Add color harmony prediction

3. **Deployment**
   - [ ] Set up CI/CD pipeline with DVC
   - [ ] Deploy to production (AWS ECS/EKS, GCP Cloud Run, etc.)
   - [ ] Configure remote artifact storage

4. **Monitoring**
   - [ ] Add model performance monitoring
   - [ ] Implement model drift detection
   - [ ] Set up prediction logging for retraining

---

**Project**: Curator - AI-Powered Wardrobe Recommendation System
