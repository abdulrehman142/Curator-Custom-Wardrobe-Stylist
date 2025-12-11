# app/utils.py
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
import io
import colorsys
import requests
import os

# thickness mapping (customize)
THICKNESS_BY_TYPE = {
    'Shirts': 'Lightweight',
    'Jeans': 'Midweight',
    'Track Pants': 'Lightweight',
    'Tshirts': 'Ultra Light',
    'Sweatshirts': 'Midweight',
    'Waistcoat': 'Lightweight',
    'Shorts': 'Ultra Light',
    'Rain Jacket': 'Heavyweight',
    'Trousers': 'Lightweight',
    'Boxers': 'Ultra Light',
    'Trunk': 'Ultra Light',
    'Sweaters': 'Heavyweight',
    'Tracksuits': 'Lightweight',
    'Swimwear': 'Ultra Light',
    'Jackets': 'Heavyweight',
    'Suspenders': 'Ultra Light',
    'Tunics': 'Lightweight',
    'Leggings': 'Ultra Light',
    'Belts': 'Ultra Light',
    'Blazers': 'Midweight',
    'Tights': 'Ultra Light',
    'Rain Trousers': 'Heavyweight',
    'Suits': 'Midweight',
    "unknown": "medium"
}

def get_dominant_color(image_bytes, k=3, resize=300):
    """
    Returns the dominant color of an image as RGB tuple.
    Uses KMeans but ignores extreme background pixels (white/near-white).
    """
    # Load image
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Resize for speed
    img.thumbnail((resize, resize))
    
    # Convert to numpy
    arr = np.array(img).reshape(-1, 3).astype(float)
    
    if len(arr) == 0:
        return (0, 0, 0)
    
    # Remove near-white and near-black pixels (likely background)
    mask = np.all(arr > 240, axis=1) | np.all(arr < 15, axis=1)
    arr_filtered = arr[~mask]
    
    if len(arr_filtered) == 0:
        arr_filtered = arr  # fallback to full array if all filtered
    
    # KMeans clustering
    kmeans = KMeans(n_clusters=min(k, len(arr_filtered)), random_state=42)
    kmeans.fit(arr_filtered)
    
    # Find cluster with most points
    counts = np.bincount(kmeans.labels_)
    dominant = kmeans.cluster_centers_[counts.argmax()].astype(int)
    
    # Return as tuple
    return tuple(int(x) for x in dominant)

def rgb_to_hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(*rgb)

def estimate_thickness(class_name):
    key = class_name.lower()
    return THICKNESS_BY_TYPE.get(key, THICKNESS_BY_TYPE["unknown"])

def get_weather(city:str, api_key:str):
    if not api_key:
        return None
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": city, "appid": api_key, "units": "metric"}
        r = requests.get(url, params=params, timeout=6)
        r.raise_for_status()
        j = r.json()
        return {
            "temp_c": j["main"]["temp"],
            "feels_like": j["main"].get("feels_like"),
            "humidity": j["main"].get("humidity"),
            "main": j["weather"][0]["main"],
            "desc": j["weather"][0]["description"]
        }
    except Exception:
        return None

def color_contrast_advice(hex1, hex2):
    # naive: compare brightness
    def lum(hexc):
        hexc = hexc.lstrip("#")
        r,g,b = tuple(int(hexc[i:i+2], 16) for i in (0,2,4))
        return 0.299*r + 0.587*g + 0.114*b
    try:
        l1 = lum(hex1)
        l2 = lum(hex2)
        if abs(l1-l2) < 30:
            return "Colors are similar; consider contrast."
    except Exception:
        pass
    return None

