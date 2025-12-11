# app/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from pydantic import BaseModel
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from .detector import classify_image_bytes
from .utils import get_dominant_color, rgb_to_hex, estimate_thickness, get_weather, color_contrast_advice
from .db import init_db
from .crud import create_item, list_items, get_item, get_items_by_class_name
from .face_analyzer import FaceAnalyzer, ClothingRecommender
from .web_scraper import get_recommendations_for_items
from .outfit_compatibility import get_model, reload_model_from_registry
from .dependencies import get_tracking_uri, get_registry_model_name, get_registry_stage
from typing import Optional, List
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import boto3
import os
import uuid
from datetime import timedelta

app = FastAPI()

S3_BUCKET = os.environ.get("S3_BUCKET", "my-app-uploads-mlops")
AWS_REGION = os.environ.get("AWS_REGION", "eu-north-1")

# Read credentials from environment only; never hardcode secrets
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

try:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )
except Exception:
    # Client will still be constructed lazily by boto3 on first call; ensure env vars exist
    s3 = boto3.client("s3", region_name=AWS_REGION)

class PresignResponse(BaseModel):
    url: str
    key: str
    expires_in: int

@app.post("/generate-presigned-url", response_model=PresignResponse)
def generate_presigned(filename: str, content_type: str = "application/octet-stream", expires_in: int = 3600):
    # Generate a unique key to avoid collisions
    key = f"user-uploads/{uuid.uuid4().hex}_{filename}"
    try:
        # Validate required configuration
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            raise RuntimeError("Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars.")
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": key,
                "ContentType": content_type,
                # optionally set ACL if you want public-read (not recommended)
            },
            ExpiresIn=expires_in,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"url": url, "key": key, "expires_in": expires_in}


# Simple test route to upload directly to S3 (useful for quick verification)
@app.post("/test-upload-s3")
async def test_upload_s3(file: UploadFile = File(...)):
    """Upload the provided file directly to the configured S3 bucket and
    return the generated S3 key and public URL (if the bucket/object is public).
    This is a convenience/testing endpoint; for production prefer presigned URLs.
    """
    try:
        contents = await file.read()
        # generate a unique key
        key = f"test-uploads/{uuid.uuid4().hex}_{file.filename}"

        # Upload to S3
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=contents,
            ContentType=(file.content_type or "application/octet-stream"),
        )

        # Construct a likely URL; note this assumes standard AWS S3 URL pattern
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"

        return JSONResponse({"key": key, "url": url})
    except Exception as e:
        logger.exception("S3 upload failed")
        raise HTTPException(status_code=500, detail=str(e))

# Example health
@app.get("/health")
def health():
    return {"status": "ok"}

logger = logging.getLogger(__name__)

# Upload directory relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Display images directory (for wardrobe display)
DISPLAY_IMAGES_DIR = os.path.join(os.path.dirname(BASE_DIR), "clothes", "test")

init_db()

# Update the first app instance with title and CORS middleware
app.title = "Wardrobe API - Classification MVP"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload_cloth(file: UploadFile = File(...)):
    contents = await file.read()

    # 1) classify
    preds = classify_image_bytes(contents, topk=1)
    top = preds[0] if preds else {"class_name": "unknown", "confidence": 0.0}
    class_name = top.get("class_name", "unknown")
    confidence = float(top.get("confidence", 0.0))

    # 2) color
    try:
        rgb = get_dominant_color(contents)
        hexc = rgb_to_hex(rgb)
    except Exception as e:
        logger.exception("Color extraction failed")
        hexc = "#000000"

    # 3) thickness
    thickness = estimate_thickness(class_name)

    # 4) save file
    fname = f"{os.urandom(8).hex()}.jpg"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, "wb") as f:
        f.write(contents)

    # 5) create DB entry
    item = create_item(
        filename=fname,
        class_name=class_name,
        confidence=confidence,
        color_hex=hexc,
        thickness=thickness,
        meta={"raw_preds": preds}
    )

    return JSONResponse({
        "id": item.id,
        "filename": item.filename,
        "class_name": item.class_name,
        "confidence": item.confidence,
        "color_hex": item.color_hex,
        "thickness": item.thickness
    })

@app.get("/wardrobe")
def get_wardrobe(limit: int = 100):
    items = list_items(limit)
    out = []
    for it in items:
        out.append({
            "id": it.id,
            "filename": it.filename,
            "class_name": it.class_name,
            "confidence": it.confidence,
            "color_hex": it.color_hex,
            "thickness": it.thickness,
            "created_at": it.created_at.isoformat()
        })
    return out

@app.get("/item/{item_id}")
def get_item_endpoint(item_id: str):
    it = get_item(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": it.id,
        "filename": it.filename,
        "class_name": it.class_name,
        "confidence": it.confidence,
        "color_hex": it.color_hex,
        "thickness": it.thickness,
        "meta": it.meta
    }

@app.get("/image/{filename}")
def serve_image(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404)
    # Add browser caching to speed up repeated loads
    # Cache for 1 day; adjust as needed
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"}
    )

@app.get("/display-image/{category}/{filename}")
def serve_display_image(category: str, filename: str):
    """Serve display images from clothes/test folder"""
    path = os.path.join(DISPLAY_IMAGES_DIR, category, filename)
    # Prevent directory traversal attacks
    if not os.path.abspath(path).startswith(os.path.abspath(DISPLAY_IMAGES_DIR)):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=604800"}  # Cache for 1 week
    )

@app.get("/display-images/{category}")
def list_display_images(category: str):
    """List available display images for a clothing category"""
    category_dir = os.path.join(DISPLAY_IMAGES_DIR, category)
    if not os.path.exists(category_dir):
        return {"images": []}
    
    try:
        files = [f for f in os.listdir(category_dir) 
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
        return {"category": category, "images": files}
    except Exception as e:
        logger.error(f"Failed to list display images: {e}")
        raise HTTPException(status_code=500, detail="Failed to list images")

def calculate_weather_score(item, temp_c, weather_condition, item_type):
    """
    Calculate weather-based suitability score (0-10) for an item
    
    Args:
        item: WardrobeItem object
        temp_c: Temperature in Celsius
        weather_condition: Weather condition (Rain, Snow, Clear, etc.)
        item_type: 'top', 'bottom', 'outer', 'shorts'
    
    Returns:
        float: Score from 0-10
    """
    score = 5.0  # Base score
    thickness = estimate_thickness(item.class_name)
    class_lower = item.class_name.lower()
    
    # Temperature-based scoring
    if item_type == 'shorts':
        # Shorts are best in warm weather
        if temp_c >= 25:
            score += 3.0
        elif temp_c >= 20:
            score += 2.0
        elif temp_c >= 15:
            score += 0.5
        elif temp_c >= 10:
            score -= 1.0
        else:
            score -= 3.0  # Very cold, shorts are not suitable
    
    elif item_type == 'bottom':
        # Long pants/bottoms are better in cooler weather
        if temp_c < 10:
            score += 2.5
        elif temp_c < 15:
            score += 2.0
        elif temp_c < 20:
            score += 1.0
        elif temp_c >= 25:
            score -= 1.0  # Too hot for long pants
    
    elif item_type == 'outer':
        # Outerwear scoring based on temperature
        if temp_c < 5:
            # Very cold - need heavy outerwear
            if thickness in ['Heavyweight']:
                score += 3.0
            elif thickness in ['Midweight']:
                score += 1.0
            else:
                score -= 1.0
        elif temp_c < 10:
            # Cold - need warm outerwear
            if thickness in ['Heavyweight', 'Midweight']:
                score += 2.5
            else:
                score += 0.5
        elif temp_c < 15:
            # Cool - light to mid outerwear
            if thickness in ['Midweight', 'Lightweight']:
                score += 2.0
            elif thickness == 'Heavyweight':
                score += 0.5
        elif temp_c < 20:
            # Mild - light outerwear or none
            if thickness in ['Lightweight', 'Ultra Light']:
                score += 1.5
            else:
                score -= 0.5
        else:
            # Warm - outerwear not needed
            score -= 2.0
    
    elif item_type == 'top':
        # Top scoring based on temperature
        if temp_c < 10:
            # Cold - prefer thicker tops
            if thickness in ['Heavyweight', 'Midweight']:
                score += 1.5
            else:
                score -= 0.5
        elif temp_c < 20:
            # Cool to mild - midweight is good
            if thickness in ['Midweight', 'Lightweight']:
                score += 1.0
        elif temp_c >= 25:
            # Hot - prefer lighter tops
            if thickness in ['Ultra Light', 'Lightweight']:
                score += 1.5
            elif thickness == 'Heavyweight':
                score -= 1.0
    
    # Weather condition adjustments
    if weather_condition.lower() in ['rain', 'drizzle']:
        if 'rain' in class_lower or 'waterproof' in class_lower:
            score += 2.0
        elif item_type == 'outer' and thickness == 'Heavyweight':
            score += 1.0
    
    if weather_condition.lower() in ['snow', 'snowy']:
        if thickness == 'Heavyweight':
            score += 2.0
        elif item_type == 'shorts':
            score -= 3.0
    
    # Confidence boost
    if hasattr(item, 'confidence'):
        score += item.confidence * 2.0  # Scale confidence to 0-2 points
    
    # Normalize to 0-10 range
    score = max(0.0, min(10.0, score))
    
    return round(score, 2)


@app.get("/recommend")
def recommend(city: Optional[str] = "Lahore", openweather_key: Optional[str] = os.environ.get("OPENWEATHER_API_KEY")):
    """
    Weather-based outfit recommendation with rating system:
    - Rates items based on temperature and weather conditions
    - Separates shorts from other bottoms
    - Returns top-rated items for each category
    """
    weather = None
    if city and openweather_key:
        weather = get_weather(city, openweather_key)
    if not weather:
        weather = {"temp_c": 20, "main": "Clear"}

    items = list_items(200)
    temp_c = weather.get("temp_c", 20)
    weather_condition = weather.get("main", "Clear")
    
    # Categorize items more accurately
    tops = [i for i in items if i.class_name.lower() in (
        "tshirt", "t-shirt", "shirt", "blouse", "dress", "sweatshirt", 
        "sweater", "tunic", "kurta", "kurti"
    )]
    
    shorts = [i for i in items if i.class_name.lower() in (
        "shorts", "short", "swimwear", "capri"
    )]
    
    bottoms = [i for i in items if i.class_name.lower() in (
        "pants", "jeans", "trousers", "track pants", "leggings", 
        "churidar", "tights", "rain trousers"
    )]
    
    outers = [i for i in items if i.class_name.lower() in (
        "jacket", "coat", "sweater", "hoodie", "blazer", "rain jacket",
        "nehru jackets", "waistcoat"
    )]

    # Rate and sort items by weather suitability
    def rate_and_sort(items_list, item_type):
        rated = []
        for item in items_list:
            score = calculate_weather_score(item, temp_c, weather_condition, item_type)
            rated.append((item, score))
        # Sort by score (descending), then by confidence
        rated.sort(key=lambda x: (x[1], x[0].confidence if hasattr(x[0], 'confidence') else 0), reverse=True)
        return rated
    
    rated_tops = rate_and_sort(tops, 'top')
    rated_shorts = rate_and_sort(shorts, 'shorts')
    rated_bottoms = rate_and_sort(bottoms, 'bottom')
    rated_outers = rate_and_sort(outers, 'outer')
    
    # Get top 3 recommendations for each category with scores
    def get_top_rated(rated_list, limit=3):
        result = []
        for item, score in rated_list[:limit]:
            result.append({
                "item": {
                    "id": item.id,
                    "filename": item.filename,
                    "class_name": item.class_name,
                    "confidence": item.confidence,
                    "color_hex": item.color_hex,
                    "thickness": estimate_thickness(item.class_name)
                },
                "weather_score": score
            })
        return result
    
    # Determine best single recommendation for backward compatibility
    best_shirt = rated_tops[0][0] if rated_tops else None
    best_pant = rated_bottoms[0][0] if rated_bottoms else None
    best_shorts = rated_shorts[0][0] if rated_shorts else None
    
    # Choose between shorts and pants based on weather score
    if rated_shorts and rated_bottoms:
        shorts_score = rated_shorts[0][1]
        pants_score = rated_bottoms[0][1]
        best_bottom = rated_shorts[0][0] if shorts_score > pants_score else rated_bottoms[0][0]
    elif rated_shorts:
        best_bottom = best_shorts
    else:
        best_bottom = best_pant
    
    # Outerwear recommendation
    best_outer = None
    if rated_outers:
        outer_score = rated_outers[0][1]
        if outer_score >= 5.0:  # Only recommend if score is decent
            best_outer = rated_outers[0][0]
    
    suggestion = {"shirt": best_shirt, "pant": best_bottom, "outer": best_outer, "notes": []}
    
    # Color advice
    if suggestion["shirt"] and suggestion["pant"]:
        adv = color_contrast_advice(suggestion["shirt"].color_hex, suggestion["pant"].color_hex) if hasattr(suggestion["shirt"], "color_hex") else None
        if adv:
            suggestion["notes"].append(adv)
    
    # Add weather-based notes
    if temp_c < 10:
        suggestion["notes"].append("Cold weather - consider layering with warm outerwear")
    elif temp_c >= 25:
        suggestion["notes"].append("Warm weather - lighter clothing recommended")
    
    if weather_condition.lower() in ['rain', 'drizzle']:
        suggestion["notes"].append("Rainy conditions - consider waterproof items")
    
    # Serialize response
    def ser(x):
        if not x: return None
        if isinstance(x, dict): return x
        return {
            "id": x.id,
            "filename": x.filename,
            "class_name": x.class_name,
            "confidence": x.confidence,
            "color_hex": x.color_hex
        }

    return {
        "weather": weather,
        "suggestion": {
            "shirt": ser(suggestion["shirt"]),
            "pant": ser(suggestion["pant"]),
            "outer": ser(suggestion["outer"])
        },
        "recommendations": {
            "tops": get_top_rated(rated_tops, 3),
            "shorts": get_top_rated(rated_shorts, 3),
            "bottoms": get_top_rated(rated_bottoms, 3),
            "outers": get_top_rated(rated_outers, 3)
        },
        "notes": suggestion["notes"]
    }


@app.post("/reload-model")
def reload_model():
    """
    Force refresh the outfit compatibility model from the MLflow Model Registry.
    Falls back to local checkpoints on failure.
    """
    refreshed = reload_model_from_registry()
    if not refreshed:
        raise HTTPException(
            status_code=500,
            detail="Failed to reload model from MLflow registry; check server logs.",
        )

    return {
        "status": "reloaded",
        "tracking_uri": get_tracking_uri(),
        "model_name": get_registry_model_name(),
        "stage": get_registry_stage(),
    }


@app.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    """
    Analyze face from uploaded photo and return skin tone and face shape analysis
    """
    try:
        contents = await file.read()
        
        analyzer = FaceAnalyzer()
        analysis = analyzer.analyze_face(contents)
        
        return JSONResponse({
            "skin_tone": analysis["skin_tone"],
            "face_shape": analysis["face_shape"],
            "face_bbox": analysis["face_bbox"]
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Face analysis failed")
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")


@app.post("/face-recommendations")
async def get_face_recommendations(file: UploadFile = File(...)):
    """
    Analyze face and get clothing recommendations with ratings (1-10) for wardrobe items
    Includes wardrobe items matching recommended types
    """
    try:
        contents = await file.read()
        
        # Analyze face
        analyzer = FaceAnalyzer()
        analysis = analyzer.analyze_face(contents)
        
        # Get recommendations
        recommender = ClothingRecommender()
        recommendations = recommender.recommend_clothing(
            analysis["skin_tone"],
            analysis["face_shape"]
        )
        
        # Get style recommendations
        style_recs = recommender.get_style_recommendations(
            analysis["skin_tone"],
            analysis["face_shape"]
        )
        
        # Format recommendations and get wardrobe items for each
        formatted_recs = []
        for item, data in recommendations:
            # Get wardrobe items matching this clothing type
            wardrobe_items = get_items_by_class_name(item, limit=5)
            wardrobe_list = []
            for w_item in wardrobe_items:
                wardrobe_list.append({
                    "id": w_item.id,
                    "filename": w_item.filename,
                    "class_name": w_item.class_name,
                    "confidence": w_item.confidence,
                    "color_hex": w_item.color_hex,
                    "thickness": w_item.thickness
                })
            
            formatted_recs.append({
                "item": item,
                "thickness": data["thickness"],
                "score": data["score"],
                "wardrobe_items": wardrobe_list
            })
        
        return JSONResponse({
            "face_analysis": {
                "skin_tone": analysis["skin_tone"],
                "face_shape": analysis["face_shape"],
                "face_bbox": analysis["face_bbox"]
            },
            "recommendations": formatted_recs,
            "style_tips": style_recs
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Face recommendation failed")
        raise HTTPException(status_code=500, detail=f"Face recommendation failed: {str(e)}")


class WebRecommendationRequest(BaseModel):
    item_names: List[str]


@app.post("/web-recommendations")
async def get_web_recommendations(request: WebRecommendationRequest):
    """
    Get web-scraped clothing recommendations for given item types
    This endpoint may take some time, so it's called separately with lazy loading
    """
    try:
        # Get top 10 items to scrape (to avoid too long wait times)
        items_to_scrape = request.item_names[:10] if len(request.item_names) > 10 else request.item_names
        
        results = get_recommendations_for_items(items_to_scrape, limit_per_item=3)
        
        return JSONResponse({
            "web_recommendations": results
        })
    except Exception as e:
        logger.exception("Web scraping failed")
        raise HTTPException(status_code=500, detail=f"Web scraping failed: {str(e)}")


# Helper function to categorize clothing items
def is_top_item(class_name: str) -> bool:
    """Check if an item is a top"""
    top_keywords = [
        'shirt', 'tshirt', 't-shirt', 'blouse', 'top', 'sweater', 
        'sweatshirt', 'hoodie', 'jacket', 'blazer', 'waistcoat',
        'kurta', 'kurti', 'tunic', 'nehru', 'romper'
    ]
    return any(keyword in class_name.lower() for keyword in top_keywords)


def is_bottom_item(class_name: str) -> bool:
    """Check if an item is a bottom"""
    bottom_keywords = [
        'pant', 'jean', 'trouser', 'short', 'skirt', 'legging',
        'churidar', 'capri', 'track pant', 'rain trouser', 'tights'
    ]
    return any(keyword in class_name.lower() for keyword in bottom_keywords)


class OutfitRequest(BaseModel):
    top_item_ids: List[str]
    bottom_item_ids: List[str]


@app.post("/outfit-recommendations")
async def get_outfit_recommendations(request: OutfitRequest):
    """
    Get outfit compatibility recommendations using Siamese MobileNetV2 model
    Takes top 5 tops and top 5 bottoms and returns best outfit pairs
    """
    try:
        # Limit to top 5 each
        top_ids = request.top_item_ids[:5]
        bottom_ids = request.bottom_item_ids[:5]
        
        if not top_ids or not bottom_ids:
            raise HTTPException(
                status_code=400, 
                detail="Need at least one top and one bottom item"
            )
        
        # Get items from database
        top_items = []
        bottom_items = []
        
        for item_id in top_ids:
            item = get_item(item_id)
            if item and is_top_item(item.class_name):
                top_items.append(item)
        
        for item_id in bottom_ids:
            item = get_item(item_id)
            if item and is_bottom_item(item.class_name):
                bottom_items.append(item)
        
        if not top_items or not bottom_items:
            raise HTTPException(
                status_code=400,
                detail="Could not find valid top or bottom items"
            )
        
        # Load images and filter items to only those with valid images
        top_images = []
        valid_top_items = []
        
        for item in top_items:
            img_path = os.path.join(UPLOAD_DIR, item.filename)
            if os.path.exists(img_path):
                try:
                    with open(img_path, 'rb') as f:
                        img_bytes = f.read()
                        if len(img_bytes) > 0:  # Ensure image is not empty
                            top_images.append(img_bytes)
                            valid_top_items.append(item)
                except Exception as e:
                    logger.warning(f"Failed to read image {img_path}: {e}")
            else:
                logger.warning(f"Image not found: {img_path}")
        
        bottom_images = []
        valid_bottom_items = []
        
        for item in bottom_items:
            img_path = os.path.join(UPLOAD_DIR, item.filename)
            if os.path.exists(img_path):
                try:
                    with open(img_path, 'rb') as f:
                        img_bytes = f.read()
                        if len(img_bytes) > 0:  # Ensure image is not empty
                            bottom_images.append(img_bytes)
                            valid_bottom_items.append(item)
                except Exception as e:
                    logger.warning(f"Failed to read image {img_path}: {e}")
            else:
                logger.warning(f"Image not found: {img_path}")
        
        if not top_images or not bottom_images:
            raise HTTPException(
                status_code=400,
                detail=f"Could not load images for items. Loaded {len(top_images)} tops and {len(bottom_images)} bottoms."
            )
        
        # Get model and compute compatibility
        model = get_model()
        
        # Prepare item metadata (only for items with valid images)
        top_metadata = [{
            'id': item.id,
            'filename': item.filename,
            'class_name': item.class_name,
            'confidence': item.confidence,
            'color_hex': item.color_hex,
            'thickness': item.thickness
        } for item in valid_top_items]
        
        bottom_metadata = [{
            'id': item.id,
            'filename': item.filename,
            'class_name': item.class_name,
            'confidence': item.confidence,
            'color_hex': item.color_hex,
            'thickness': item.thickness
        } for item in valid_bottom_items]
        
        # Get best outfits
        outfits = model.get_best_outfits(
            top_images,
            bottom_images,
            top_metadata,
            bottom_metadata,
            top_k=10
        )
        
        # Format response
        formatted_outfits = []
        for outfit in outfits:
            formatted_outfits.append({
                'top': outfit['top'],
                'bottom': outfit['bottom'],
                'compatibility_score': round(outfit['compatibility_score'], 4)
            })
        
        return JSONResponse({
            'outfits': formatted_outfits,
            'total_combinations': len(top_items) * len(bottom_items)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Outfit recommendation failed")
        raise HTTPException(status_code=500, detail=f"Outfit recommendation failed: {str(e)}")

