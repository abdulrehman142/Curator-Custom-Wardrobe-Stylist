# app/outfit_compatibility.py
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import io
import os
import logging
from typing import List, Tuple, Dict
import numpy as np
import mlflow
from mlflow import pytorch as mlflow_pytorch
from mlflow.exceptions import MlflowException

from .dependencies import (
    get_mlflow_client,
    get_registry_model_name,
    get_registry_stage,
    get_tracking_uri,
)

logger = logging.getLogger(__name__)

# Model configuration from MLflow params
IMAGE_SIZE = 128
EMBEDDING_DIM = 128  # Standard for Siamese networks with MobileNetV2


class SiameseMobileNetV2(nn.Module):
    """Siamese Network using MobileNetV2 for outfit compatibility"""
    
    def __init__(self, embedding_dim=EMBEDDING_DIM):
        super(SiameseMobileNetV2, self).__init__()
        
        # Load pretrained MobileNetV2
        mobilenet = models.mobilenet_v2(pretrained=True)
        
        # Remove the classifier and get features
        # Keep as-is (not wrapped in Sequential)
        self.backbone = mobilenet.features
        
        # Add custom embedding layer
        self.embedding = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(1280, embedding_dim),  # MobileNetV2 last feature dim is 1280
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(embedding_dim, embedding_dim)
        )
        
        # Compatibility scoring head
        self.compatibility_head = nn.Sequential(
            nn.Linear(embedding_dim * 2, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )
    
    def forward(self, img1, img2):
        """Forward pass for pair of images"""
        # Extract features from both images
        feat1 = self.backbone(img1)
        feat2 = self.backbone(img2)
        
        # Get embeddings
        emb1 = self.embedding(feat1)
        emb2 = self.embedding(feat2)
        
        # Normalize embeddings
        emb1 = nn.functional.normalize(emb1, p=2, dim=1)
        emb2 = nn.functional.normalize(emb2, p=2, dim=1)
        
        # Concatenate for compatibility score
        combined = torch.cat([emb1, emb2], dim=1)
        compatibility_score = self.compatibility_head(combined)
        
        return compatibility_score, emb1, emb2
    
    def get_embedding(self, img):
        """Get embedding for a single image"""
        feat = self.backbone(img)
        emb = self.embedding(feat)
        emb = nn.functional.normalize(emb, p=2, dim=1)
        return emb


class SiameseMobileNetV2Sequential(nn.Module):
    """Siamese Network with Sequential backbone wrapper for compatibility"""
    
    def __init__(self, embedding_dim=EMBEDDING_DIM):
        super(SiameseMobileNetV2Sequential, self).__init__()
        
        # Load pretrained MobileNetV2
        mobilenet = models.mobilenet_v2(pretrained=True)
        
        # Wrap features in Sequential to match checkpoint structure
        # The checkpoint has backbone.0.0.weight, so we need Sequential(Sequential(features))
        # But mobilenet.features is already Sequential, so wrapping it creates the right structure
        self.backbone = nn.Sequential(*[mobilenet.features])
        
        # Add custom embedding layer
        self.embedding = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(1280, embedding_dim),  # MobileNetV2 last feature dim is 1280
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(embedding_dim, embedding_dim)
        )
        
        # Compatibility scoring head
        self.compatibility_head = nn.Sequential(
            nn.Linear(embedding_dim * 2, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )
    
    def forward(self, img1, img2):
        """Forward pass for pair of images"""
        # Extract features from both images
        feat1 = self.backbone(img1)
        feat2 = self.backbone(img2)
        
        # Get embeddings
        emb1 = self.embedding(feat1)
        emb2 = self.embedding(feat2)
        
        # Normalize embeddings
        emb1 = nn.functional.normalize(emb1, p=2, dim=1)
        emb2 = nn.functional.normalize(emb2, p=2, dim=1)
        
        # Concatenate for compatibility score
        combined = torch.cat([emb1, emb2], dim=1)
        compatibility_score = self.compatibility_head(combined)
        
        return compatibility_score, emb1, emb2
    
    def get_embedding(self, img):
        """Get embedding for a single image"""
        feat = self.backbone(img)
        emb = self.embedding(feat)
        emb = nn.functional.normalize(emb, p=2, dim=1)
        return emb




class OutfitCompatibilityModel:
    """Wrapper for loading and using the outfit compatibility model"""
    
    def __init__(self, model_path: str = None, force_registry: bool = False):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.model_path = model_path

        # MLflow configuration
        self.tracking_uri = get_tracking_uri()
        self.registry_model_name = get_registry_model_name()
        self.registry_stage = get_registry_stage()
        mlflow.set_tracking_uri(self.tracking_uri)
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        if force_registry:
            self._load_from_registry(raise_on_fail=True)
        else:
            loaded_from_registry = False
            if self.model_path is None:
                loaded_from_registry = self._load_from_registry()

            if not loaded_from_registry:
                self.model_path = self.model_path or self._find_model_path()
                self._load_local_checkpoint()
    
    def _find_model_path(self):
        """Find the model checkpoint file"""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Try multiple possible locations (updated for backend structure)
        possible_paths = [
            os.path.join(base_dir, "models", "compat_mobilenetv2.pth"),
            os.path.join(base_dir, "artifacts", "compatibility", "compat_mobilenetv2.pth"),
            os.path.join(base_dir, "mlruns", "173714138228230283", "a244f9e2da7841fb8ce0a19cc7718cb9", "artifacts", "compat_mobilenetv2.pth"),
            os.path.join(base_dir, "app", "models", "compat_mobilenetv2.pth"),  # Fallback for old structure
            "compat_mobilenetv2.pth",
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logger.info(f"Found model at: {path}")
                return path
        
        raise FileNotFoundError(
            f"Model file not found. Tried: {possible_paths}. "
            "Please ensure compat_mobilenetv2.pth exists in one of these locations."
        )
    
    def _load_local_checkpoint(self):
        """Load the trained model from a local checkpoint."""
        try:
            # Load checkpoint first to inspect structure
            checkpoint = torch.load(self.model_path, map_location=self.device)
            
            # Extract state_dict
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    state_dict = checkpoint['model_state_dict']
                elif 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                else:
                    state_dict = checkpoint
            else:
                state_dict = checkpoint
            
            # Inspect the state_dict keys to understand architecture
            state_dict_keys = list(state_dict.keys())
            logger.info(f"Checkpoint has {len(state_dict_keys)} keys")
            logger.info(f"Sample keys: {state_dict_keys[:5]}")
            
            # Check if backbone keys use Sequential indexing (e.g., backbone.0.0.weight)
            # This indicates the backbone was saved as Sequential(Sequential(...))
            has_sequential_backbone = any('backbone.' in k and len(k.split('.')) > 2 and k.split('.')[1].isdigit() for k in state_dict_keys[:10])
            
            if has_sequential_backbone:
                # The checkpoint was saved with backbone wrapped in Sequential
                logger.info("Detected Sequential backbone structure in checkpoint")
                self.model = SiameseMobileNetV2Sequential(embedding_dim=EMBEDDING_DIM)
            else:
                # Standard structure
                self.model = SiameseMobileNetV2(embedding_dim=EMBEDDING_DIM)
            
            self.model.to(self.device)
            self.model.eval()
            
            # Try loading with strict=False first
            missing_keys, unexpected_keys = self.model.load_state_dict(state_dict, strict=False)
            
            if missing_keys:
                logger.warning(f"Missing {len(missing_keys)} keys. First few: {missing_keys[:5]}")
                # Try to map the keys
                mapped_state_dict = self._map_checkpoint_keys(state_dict, missing_keys)
                if mapped_state_dict:
                    missing_keys2, unexpected_keys2 = self.model.load_state_dict(mapped_state_dict, strict=False)
                    logger.info(f"After mapping: {len(missing_keys2)} missing, {len(unexpected_keys2)} unexpected")
            
            if unexpected_keys:
                logger.warning(f"Unexpected {len(unexpected_keys)} keys. First few: {unexpected_keys[:5]}")
            
            # Log success if we loaded most keys
            if len(missing_keys) < len(state_dict_keys) * 0.3:
                logger.info(f"Model loaded successfully from {self.model_path}")
            else:
                logger.warning(f"Model partially loaded - {len(missing_keys)}/{len(state_dict_keys)} keys missing")
                
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _load_from_registry(self, raise_on_fail: bool = False) -> bool:
        """
        Attempt to fetch the latest model from the MLflow Model Registry.

        Returns True if successfully loaded, otherwise False.
        """
        try:
            client = get_mlflow_client()
            candidates = client.get_latest_versions(
                self.registry_model_name, stages=[self.registry_stage]
            )
            if not candidates:
                logger.info(
                    f"No registry versions found for {self.registry_model_name} in stage {self.registry_stage}"
                )
                return False

            version = candidates[0]
            model_uri = f"models:/{self.registry_model_name}/{version.version}"
            logger.info(f"Loading compatibility model from MLflow registry: {model_uri}")

            # Load the logged PyTorch model directly from MLflow
            self.model = mlflow_pytorch.load_model(model_uri=model_uri, map_location=self.device)
            self.model.to(self.device)
            self.model.eval()
            self.model_path = model_uri
            logger.info(
                f"Loaded compatibility model from registry version {version.version} (stage={version.current_stage})"
            )
            return True
        except MlflowException as mlflow_exc:
            logger.warning(f"MLflow registry load failed: {mlflow_exc}")
        except Exception as exc:
            logger.warning(f"Unexpected error loading from registry: {exc}")

        if raise_on_fail:
            raise RuntimeError(
                f"Failed to load model from MLflow registry {self.registry_model_name}:{self.registry_stage}"
            )
        return False
    
    def _map_checkpoint_keys(self, state_dict, missing_keys):
        """Try to map checkpoint keys to model keys"""
        model_state_dict = self.model.state_dict()
        mapped_dict = {}
        
        # Create a mapping: checkpoint_key -> model_key
        for ckpt_key in state_dict.keys():
            if ckpt_key in model_state_dict:
                # Direct match
                mapped_dict[ckpt_key] = state_dict[ckpt_key]
            elif 'backbone.0.' in ckpt_key:
                # Try removing the extra Sequential wrapper
                # backbone.0.0.weight -> backbone.0.weight
                new_key = ckpt_key.replace('backbone.0.', 'backbone.', 1)
                if new_key in model_state_dict:
                    mapped_dict[new_key] = state_dict[ckpt_key]
                else:
                    mapped_dict[ckpt_key] = state_dict[ckpt_key]
            else:
                mapped_dict[ckpt_key] = state_dict[ckpt_key]
        
        return mapped_dict
    
    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        """Preprocess image bytes to tensor"""
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_tensor = self.transform(img).unsqueeze(0)  # Add batch dimension
            return img_tensor.to(self.device)
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    def compute_compatibility(self, top_image_bytes: bytes, bottom_image_bytes: bytes) -> float:
        """Compute compatibility score between top and bottom"""
        with torch.no_grad():
            top_tensor = self.preprocess_image(top_image_bytes)
            bottom_tensor = self.preprocess_image(bottom_image_bytes)
            
            compatibility_score, _, _ = self.model(top_tensor, bottom_tensor)
            
            return float(compatibility_score.item())
    
    def compute_compatibility_batch(
        self, 
        top_images: List[bytes], 
        bottom_images: List[bytes]
    ) -> List[List[float]]:
        """Compute compatibility scores for all pairs"""
        scores = []
        
        for top_img_bytes in top_images:
            row_scores = []
            for bottom_img_bytes in bottom_images:
                score = self.compute_compatibility(top_img_bytes, bottom_img_bytes)
                row_scores.append(score)
            scores.append(row_scores)
        
        return scores
    
    def get_best_outfits(
        self,
        top_images: List[bytes],
        bottom_images: List[bytes],
        top_items: List[Dict],
        bottom_items: List[Dict],
        top_k: int = 10
    ) -> List[Dict]:
        """
        Get top-k best outfit combinations
        
        Args:
            top_images: List of image bytes for tops
            bottom_images: List of image bytes for bottoms
            top_items: List of top item metadata (with id, filename, etc.)
            bottom_items: List of bottom item metadata
            top_k: Number of best outfits to return
            
        Returns:
            List of outfit dictionaries with compatibility scores
        """
        # Ensure we have matching lengths
        num_tops = min(len(top_images), len(top_items))
        num_bottoms = min(len(bottom_images), len(bottom_items))
        
        if num_tops == 0 or num_bottoms == 0:
            logger.warning("No valid top or bottom items to process")
            return []
        
        # Trim lists to matching lengths
        top_images = top_images[:num_tops]
        bottom_images = bottom_images[:num_bottoms]
        top_items = top_items[:num_tops]
        bottom_items = bottom_items[:num_bottoms]
        
        # Compute all compatibility scores
        scores = self.compute_compatibility_batch(top_images, bottom_images)
        
        # Verify scores shape matches expectations
        if len(scores) != num_tops:
            logger.error(f"Score matrix has {len(scores)} rows but expected {num_tops}")
            return []
        
        # Create list of all combinations with scores
        outfits = []
        for i, top_item in enumerate(top_items):
            if i >= len(scores):
                logger.warning(f"Index {i} out of range for scores (length {len(scores)})")
                continue
            for j, bottom_item in enumerate(bottom_items):
                if j >= len(scores[i]):
                    logger.warning(f"Index {j} out of range for scores[{i}] (length {len(scores[i])})")
                    continue
                outfits.append({
                    'top': top_item,
                    'bottom': bottom_item,
                    'compatibility_score': scores[i][j]
                })
        
        # Sort by compatibility score (descending)
        outfits.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return outfits[:top_k]


# Global model instance (lazy loaded)
_model_instance = None


def get_model(force_reload: bool = False) -> OutfitCompatibilityModel:
    """
    Get or create the global model instance. Optionally force a reload to pick
    up the newest registry version or fallback checkpoints.
    """
    global _model_instance
    if _model_instance is None or force_reload:
        _model_instance = OutfitCompatibilityModel()
    return _model_instance


def reload_model_from_registry() -> bool:
    """
    Force-refresh the model from the MLflow registry. Returns True on success.
    """
    global _model_instance
    try:
        _model_instance = OutfitCompatibilityModel(force_registry=True)
        return True
    except Exception as exc:
        logger.error(f"Failed to reload model from registry: {exc}")
        return False

