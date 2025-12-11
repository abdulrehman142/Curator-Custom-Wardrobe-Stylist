import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WardrobeItem {
  id: string;
  filename: string;
  class_name: string;
  confidence: number;
  color_hex: string;
  thickness: string;
  created_at?: string;
  meta?: any;
}

export interface RatedItem {
  item: WardrobeItem & { thickness?: string };
  weather_score: number;
}

export interface Recommendation {
  weather: {
    temp_c: number;
    main: string;
  };
  suggestion: {
    shirt: WardrobeItem | null;
    pant: WardrobeItem | null;
    outer: WardrobeItem | null;
  };
  recommendations?: {
    tops: RatedItem[];
    shorts: RatedItem[];
    bottoms: RatedItem[];
    outers: RatedItem[];
  };
  notes: string[];
}

export interface FaceAnalysis {
  skin_tone: {
    rgb: number[];
    luminance: number;
    undertone: number;
    category: string;
  };
  face_shape: string;
  face_bbox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ClothingRecommendation {
  item: string;
  thickness: string;
  score: number;
  wardrobe_items: WardrobeItem[];
}

export interface WebProduct {
  category: string;
  title: string;
  link: string | null;
  price: string;
  default_image: string | null;
  hover_image: string | null;
  colors: string[];
}

export interface WebRecommendations {
  [itemName: string]: WebProduct[];
}

export interface Outfit {
  top: WardrobeItem;
  bottom: WardrobeItem;
  compatibility_score: number;
}

export interface OutfitRecommendationResponse {
  outfits: Outfit[];
  total_combinations: number;
}

export interface FaceRecommendationResponse {
  face_analysis: FaceAnalysis;
  recommendations: ClothingRecommendation[];
  style_tips: {
    colors: string[];
    face_shape_tips: {
      necklines?: string[];
      collars?: string[];
      accessories?: string[];
    };
  };
}

export const wardrobeApi = {
  // Upload a cloth image
  uploadCloth: async (file: File): Promise<WardrobeItem> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get all wardrobe items
  getWardrobe: async (limit: number = 100): Promise<WardrobeItem[]> => {
    const response = await api.get('/wardrobe', {
      params: { limit },
    });
    return response.data;
  },

  // Get a specific item
  getItem: async (itemId: string): Promise<WardrobeItem> => {
    const response = await api.get(`/item/${itemId}`);
    return response.data;
  },

  // Get image URL
  getImageUrl: (filename: string): string => {
    return `${API_BASE_URL}/image/${filename}`;
  },

  // Get display image URL for a clothing category
  getDisplayImageUrl: (category: string, filename: string): string => {
    return `${API_BASE_URL}/display-image/${category}/${filename}`;
  },

  // List available display images for a category
  listDisplayImages: async (category: string): Promise<{ category: string; images: string[] }> => {
    const response = await api.get(`/display-images/${category}`);
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (
    city: string = 'Lahore',
    openweatherKey: string = process.env.NEXT_PUBLIC_OPENWEATHER_KEY as string
  ): Promise<Recommendation> => {
    const response = await api.get('/recommend', {
      params: { city, openweather_key: openweatherKey },
    });
    return response.data;
  },

  // Analyze face from photo
  analyzeFace: async (file: File): Promise<FaceAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/analyze-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get face-based clothing recommendations
  getFaceRecommendations: async (file: File): Promise<FaceRecommendationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/face-recommendations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get web-scraped recommendations
  getWebRecommendations: async (itemNames: string[]): Promise<{ web_recommendations: WebRecommendations }> => {
    const response = await api.post('/web-recommendations', {
      item_names: itemNames,
    });
    return response.data;
  },

  // Get outfit compatibility recommendations
  getOutfitRecommendations: async (
    topItemIds: string[],
    bottomItemIds: string[]
  ): Promise<OutfitRecommendationResponse> => {
    const response = await api.post('/outfit-recommendations', {
      top_item_ids: topItemIds,
      bottom_item_ids: bottomItemIds,
    });
    return response.data;
  },
};

