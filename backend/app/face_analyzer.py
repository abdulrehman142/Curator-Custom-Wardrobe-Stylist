# app/face_analyzer.py
import cv2
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter
import io
from PIL import Image
import os

try:
    import dlib
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False
    print("Warning: Dlib not available. Using basic face shape detection.")


class FaceAnalyzer:
    def __init__(self):
        """Initialize face analyzer with detection models"""
        # Load face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Try to load dlib shape predictor
        self.use_dlib = False
        if DLIB_AVAILABLE:
            try:
                # Try common paths for the shape predictor (updated for backend structure)
                BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                predictor_paths = [
                    'shape_predictor_68_face_landmarks.dat',
                    os.path.join(BASE_DIR, 'weights', 'shape_predictor_68_face_landmarks.dat'),
                    os.path.join(BASE_DIR, 'app', 'weights', 'shape_predictor_68_face_landmarks.dat'),
                ]
                
                predictor_path = None
                for path in predictor_paths:
                    if os.path.exists(path):
                        predictor_path = path
                        break
                
                if predictor_path:
                    self.predictor = dlib.shape_predictor(predictor_path)
                    self.detector = dlib.get_frontal_face_detector()
                    self.use_dlib = True
            except Exception as e:
                print(f"Warning: Could not load dlib predictor: {e}")
    
    def load_image_from_bytes(self, image_bytes):
        """Load image from bytes"""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # Convert PIL to OpenCV format
        img_array = np.array(img)
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        return img_bgr
    
    def detect_face(self, img):
        """Detect face in image"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            raise ValueError("No face detected in the image")
        
        # Get largest face
        face = max(faces, key=lambda x: x[2] * x[3])
        return face
    
    def calculate_skin_tone(self, img, face):
        """Calculate skin tone from face region"""
        x, y, w, h = face
        
        # Extract face region with some margin
        margin = int(w * 0.1)
        face_region = img[max(0, y+margin):min(img.shape[0], y+h-margin), 
                          max(0, x+margin):min(img.shape[1], x+w-margin)]
        
        if face_region.size == 0:
            raise ValueError("Face region is too small")
        
        # Convert to HSV for better skin detection
        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        
        # Define skin color range in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin pixels
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Extract skin pixels
        skin_pixels = face_region[mask > 0]
        
        if len(skin_pixels) == 0:
            # Fallback: use center region of face
            center_h, center_w = h // 3, w // 3
            center_y = max(0, y + center_h)
            center_x = max(0, x + center_w)
            end_y = min(img.shape[0], y + 2*center_h)
            end_x = min(img.shape[1], x + 2*center_w)
            skin_pixels = img[center_y:end_y, center_x:end_x]
            skin_pixels = skin_pixels.reshape(-1, 3)
        
        if len(skin_pixels) == 0:
            raise ValueError("Could not extract skin pixels")
        
        # Use KMeans to find dominant color
        n_clusters = min(3, len(skin_pixels))
        if n_clusters < 1:
            raise ValueError("Not enough skin pixels for analysis")
            
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        kmeans.fit(skin_pixels)
        
        # Get the most common cluster
        labels = kmeans.labels_
        most_common = Counter(labels).most_common(1)[0][0]
        dominant_color = kmeans.cluster_centers_[most_common]
        
        # Convert BGR to RGB
        dominant_color = dominant_color[::-1]
        
        # Calculate skin tone metrics
        r, g, b = dominant_color
        
        # ITU-R BT.601 luminance
        luminance = 0.299 * r + 0.587 * g + 0.114 * b
        
        # Calculate undertone (warmer vs cooler)
        undertone = (r - b) / 255.0 if 255 > 0 else 0  # Positive = warm, Negative = cool
        
        return {
            'rgb': [float(x) for x in dominant_color],
            'luminance': float(luminance),
            'undertone': float(undertone),
            'category': self._categorize_skin_tone(luminance)
        }
    
    def _categorize_skin_tone(self, luminance):
        """Categorize skin tone based on luminance"""
        if luminance < 100:
            return 'deep'
        elif luminance < 140:
            return 'dark'
        elif luminance < 170:
            return 'medium-dark'
        elif luminance < 200:
            return 'medium'
        elif luminance < 220:
            return 'medium-light'
        else:
            return 'light'
    
    def calculate_face_shape(self, img, face):
        """Calculate face shape from facial landmarks or ratios"""
        if self.use_dlib:
            return self._calculate_face_shape_dlib(img, face)
        else:
            return self._calculate_face_shape_basic(face)
    
    def _calculate_face_shape_dlib(self, img, face):
        """Calculate face shape using dlib landmarks"""
        x, y, w, h = face
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Convert to dlib rectangle
        rect = dlib.rectangle(x, y, x+w, y+h)
        landmarks = self.predictor(gray, rect)
        
        # Extract key measurements
        points = np.array([[p.x, p.y] for p in landmarks.parts()])
        
        # Face width at different heights
        jaw_width = np.linalg.norm(points[0] - points[16])
        cheek_width = np.linalg.norm(points[1] - points[15])
        mid_face_width = np.linalg.norm(points[3] - points[13])
        
        # Face height
        face_height = np.linalg.norm(points[8] - points[27])
        
        if face_height == 0:
            return self._calculate_face_shape_basic(face)
        
        # Calculate ratios
        width_height_ratio = jaw_width / face_height
        jaw_cheek_ratio = jaw_width / cheek_width if cheek_width > 0 else 1.0
        
        return self._classify_face_shape(width_height_ratio, jaw_cheek_ratio)
    
    def _calculate_face_shape_basic(self, face):
        """Calculate face shape using basic width/height ratio"""
        x, y, w, h = face
        ratio = w / h if h > 0 else 0.75
        
        if ratio > 0.85:
            return 'round'
        elif ratio > 0.75:
            return 'square'
        elif ratio > 0.65:
            return 'oval'
        else:
            return 'long'
    
    def _classify_face_shape(self, wh_ratio, jc_ratio):
        """Classify face shape based on ratios"""
        if wh_ratio > 0.85:
            if jc_ratio > 0.95:
                return 'round'
            else:
                return 'square'
        elif wh_ratio > 0.75:
            if jc_ratio < 0.9:
                return 'heart'
            else:
                return 'oval'
        else:
            if jc_ratio < 0.9:
                return 'diamond'
            else:
                return 'long'
    
    def analyze_face(self, image_bytes):
        """Complete face analysis pipeline"""
        img = self.load_image_from_bytes(image_bytes)
        face = self.detect_face(img)
        skin_tone = self.calculate_skin_tone(img, face)
        face_shape = self.calculate_face_shape(img, face)
        
        return {
            'skin_tone': skin_tone,
            'face_shape': face_shape,
            'face_bbox': {
                'x': int(face[0]),
                'y': int(face[1]),
                'w': int(face[2]),
                'h': int(face[3])
            }
        }


class ClothingRecommender:
    def __init__(self):
        """Initialize clothing recommender with wardrobe"""
        self.wardrobe = {
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
            'Capris': 'Lightweight',
            'Kurtas': 'Lightweight',
            'Nehru Jackets': 'Midweight',
            'Kurtis': 'Lightweight',
            'Churidar': 'Lightweight',
            'Tunics': 'Lightweight',
            'Rompers': 'Lightweight',
            'Leggings': 'Ultra Light',
            'Belts': 'Ultra Light',
            'Blazers': 'Midweight',
            'Tights': 'Ultra Light',
            'Rain Trousers': 'Heavyweight',
            'Suits': 'Midweight'
        }
        
        # Color recommendations based on skin tone and undertone
        self.color_recommendations = {
            'deep': {
                'warm': ['jewel tones', 'bright colors', 'gold accents'],
                'cool': ['bright whites', 'royal blue', 'emerald', 'silver accents']
            },
            'dark': {
                'warm': ['earth tones', 'warm reds', 'oranges', 'gold'],
                'cool': ['cool blues', 'purples', 'bright pinks', 'silver']
            },
            'medium-dark': {
                'warm': ['olive', 'rust', 'terracotta', 'warm browns'],
                'cool': ['teal', 'burgundy', 'forest green', 'charcoal']
            },
            'medium': {
                'warm': ['peach', 'coral', 'warm greens', 'camel'],
                'cool': ['dusty pink', 'soft blues', 'lavender', 'gray']
            },
            'medium-light': {
                'warm': ['warm neutrals', 'soft oranges', 'warm beige'],
                'cool': ['soft blues', 'cool grays', 'rose', 'mint']
            },
            'light': {
                'warm': ['pastels', 'soft yellows', 'peach', 'warm whites'],
                'cool': ['pastels', 'cool pinks', 'baby blue', 'bright white']
            }
        }
        
        # Style recommendations based on face shape
        self.face_shape_styles = {
            'oval': {
                'necklines': ['V-neck', 'crew neck', 'scoop neck'],
                'collars': ['most styles work well'],
                'accessories': ['statement pieces', 'long necklaces']
            },
            'round': {
                'necklines': ['V-neck', 'elongated U-neck'],
                'collars': ['pointed collars', 'vertical lines'],
                'accessories': ['long necklaces', 'angular accessories']
            },
            'square': {
                'necklines': ['rounded necklines', 'scoop neck'],
                'collars': ['soft collars', 'curved lines'],
                'accessories': ['rounded accessories', 'soft shapes']
            },
            'heart': {
                'necklines': ['V-neck', 'scoop neck', 'boat neck'],
                'collars': ['wide collars', 'horizontal lines'],
                'accessories': ['wider necklaces', 'statement earrings']
            },
            'long': {
                'necklines': ['boat neck', 'wide necklines'],
                'collars': ['wide collars', 'horizontal patterns'],
                'accessories': ['chokers', 'short necklaces']
            },
            'diamond': {
                'necklines': ['sweetheart', 'oval necklines'],
                'collars': ['soft collars'],
                'accessories': ['medium length necklaces']
            }
        }
    
    def recommend_clothing(self, skin_tone, face_shape):
        """Generate clothing recommendations with ratings"""
        recommendations = {}
        
        for item, thickness in self.wardrobe.items():
            score = self._calculate_score(item, thickness, skin_tone, face_shape)
            recommendations[item] = {
                'thickness': thickness,
                'score': score
            }
        
        # Sort by score
        sorted_recommendations = sorted(
            recommendations.items(), 
            key=lambda x: x[1]['score'], 
            reverse=True
        )
        
        return sorted_recommendations
    
    def _calculate_score(self, item, thickness, skin_tone, face_shape):
        """Calculate suitability score (1-10) for clothing item"""
        score = 5.0  # Base score
        
        # Adjust based on skin tone category
        tone_category = skin_tone['category']
        undertone_type = 'warm' if skin_tone['undertone'] > 0 else 'cool'
        
        # Lightweight and ultra-light items generally work better with lighter tones
        if thickness in ['Ultra Light', 'Lightweight']:
            if tone_category in ['light', 'medium-light', 'medium']:
                score += 1.5
        
        # Heavyweight items can work well with all tones but especially darker tones
        if thickness == 'Heavyweight':
            if tone_category in ['deep', 'dark']:
                score += 1.0
        
        # Face shape considerations for specific items
        if face_shape in self.face_shape_styles:
            shape_prefs = self.face_shape_styles[face_shape]
            
            # V-neck friendly items score higher for round/long faces
            if 'V-neck' in str(shape_prefs.get('necklines', [])):
                if item in ['Shirts', 'Tshirts', 'Kurtas', 'Tunics', 'Kurtis']:
                    score += 1.0
            
            # Structured items for square/diamond faces
            if face_shape in ['square', 'diamond']:
                if item in ['Blazers', 'Suits', 'Jackets']:
                    score += 0.5
        
        # Formal wear bonus for structured faces
        if face_shape in ['square', 'diamond', 'oval']:
            if item in ['Suits', 'Blazers', 'Nehru Jackets']:
                score += 0.8
        
        # Casual wear bonus for round/heart faces
        if face_shape in ['round', 'heart']:
            if item in ['Tshirts', 'Sweatshirts', 'Kurtas', 'Kurtis']:
                score += 0.7
        
        # Undertone adjustments
        if undertone_type == 'warm':
            if item in ['Kurtas', 'Nehru Jackets', 'Waistcoat']:
                score += 0.5
        else:  # cool
            if item in ['Blazers', 'Suits', 'Shirts']:
                score += 0.5
        
        # Normalize to 1-10 scale
        score = max(1.0, min(10.0, score))
        
        return round(score, 1)
    
    def get_style_recommendations(self, skin_tone, face_shape):
        """Get detailed style recommendations"""
        tone_category = skin_tone['category']
        undertone_type = 'warm' if skin_tone['undertone'] > 0 else 'cool'
        
        recommendations = {
            'colors': self.color_recommendations.get(tone_category, {}).get(undertone_type, []),
            'face_shape_tips': self.face_shape_styles.get(face_shape, {})
        }
        
        return recommendations

