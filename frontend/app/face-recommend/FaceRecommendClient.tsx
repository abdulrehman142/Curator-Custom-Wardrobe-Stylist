'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { wardrobeApi, FaceRecommendationResponse, WebRecommendations } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Upload, X, Image as ImageIcon, Sparkles, Palette, User, ExternalLink, RefreshCw } from 'lucide-react';

export default function FaceRecommendClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<FaceRecommendationResponse | null>(null);
  const [webRecommendations, setWebRecommendations] = useState<WebRecommendations>({});
  const [loadingWebRecs, setLoadingWebRecs] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Helper functions to categorize items
  const isTopItem = (className: string): boolean => {
    const topKeywords = [
      'shirt', 'tshirt', 't-shirt', 'blouse', 'top', 'sweater',
      'sweatshirt', 'hoodie', 'jacket', 'blazer', 'waistcoat',
      'kurta', 'kurti', 'tunic', 'nehru', 'romper'
    ];
    return topKeywords.some(keyword => className.toLowerCase().includes(keyword));
  };

  const isBottomItem = (className: string): boolean => {
    const bottomKeywords = [
      'pant', 'jean', 'trouser', 'short', 'skirt', 'legging',
      'churidar', 'capri', 'track pant', 'rain trouser', 'tights'
    ];
    return bottomKeywords.some(keyword => className.toLowerCase().includes(keyword));
  };

  const handleGetOutfitRecommendations = () => {
    if (!recommendations) return;

    // Collect top 5 tops and top 5 bottoms from recommendations
    const topIds: string[] = [];
    const bottomIds: string[] = [];

    for (const rec of recommendations.recommendations) {
      // Check if the recommended item type is a top or bottom
      if (isTopItem(rec.item) && rec.wardrobe_items.length > 0) {
        // Add wardrobe items of this type (up to 5 total)
        for (const item of rec.wardrobe_items) {
          if (topIds.length < 5) {
            topIds.push(item.id);
          }
        }
      } else if (isBottomItem(rec.item) && rec.wardrobe_items.length > 0) {
        // Add wardrobe items of this type (up to 5 total)
        for (const item of rec.wardrobe_items) {
          if (bottomIds.length < 5) {
            bottomIds.push(item.id);
          }
        }
      }
    }

    // If we don't have enough from recommendations, get from wardrobe
    if (topIds.length < 5 || bottomIds.length < 5) {
      // Get all wardrobe items and filter
      wardrobeApi.getWardrobe(200).then((items) => {
        for (const item of items) {
          if (topIds.length < 5 && isTopItem(item.class_name)) {
            topIds.push(item.id);
          }
          if (bottomIds.length < 5 && isBottomItem(item.class_name)) {
            bottomIds.push(item.id);
          }
        }

        if (topIds.length >= 1 && bottomIds.length >= 1) {
          router.push(
            `/outfit-recommend?top_ids=${topIds.join(',')}&bottom_ids=${bottomIds.join(',')}`
          );
        } else {
          setError('Need at least one top and one bottom item in your wardrobe');
        }
      });
    } else {
      router.push(
        `/outfit-recommend?top_ids=${topIds.join(',')}&bottom_ids=${bottomIds.join(',')}`
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setRecommendations(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
      setRecommendations(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setWebRecommendations({});
    setLoadingWebRecs({});

    try {
      const data = await wardrobeApi.getFaceRecommendations(file);
      setRecommendations(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadWebRecommendations = async (itemName: string) => {
    if (loadingWebRecs[itemName] || webRecommendations[itemName]) {
      return; // Already loading or loaded
    }

    setLoadingWebRecs(prev => ({ ...prev, [itemName]: true }));

    try {
      const data = await wardrobeApi.getWebRecommendations([itemName]);
      if (data.web_recommendations[itemName]) {
        setWebRecommendations(prev => ({
          ...prev,
          [itemName]: data.web_recommendations[itemName]
        }));
      }
    } catch (err) {
      console.error(`Failed to load web recommendations for ${itemName}:`, err);
    } finally {
      setLoadingWebRecs(prev => ({ ...prev, [itemName]: false }));
    }
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!recommendations) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemName = entry.target.getAttribute('data-item-name');
            if (itemName) {
              loadWebRecommendations(itemName);
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [recommendations]);

  // Observe recommendation items when they're rendered
  useEffect(() => {
    if (!recommendations || !observerRef.current) return;

    const items = document.querySelectorAll('[data-item-name]');
    items.forEach((item) => {
      observerRef.current?.observe(item);
    });

    return () => {
      items.forEach((item) => {
        observerRef.current?.unobserve(item);
      });
    };
  }, [recommendations]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Face-Based Recommendations
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70">
          Upload your photo to get personalized clothing recommendations based on your skin tone and face shape
        </p>
      </div>

      <Card className="mb-8">
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-md p-8 md:p-12 text-center transition-all duration-smooth ${
            preview
              ? 'border-[#231212] dark:border-white bg-neutral-soft dark:bg-white'
              : 'border-white dark:border-white hover:border-[#231212] dark:hover:border-white'
          }`}
        >
          {preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-md shadow-lg"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setRecommendations(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-black rounded-full border-2 border-[#231212] dark:border-white hover:bg-[#231212] dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors duration-smooth"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-body text-black dark:text-white opacity-70">{file?.name}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-neutral-soft dark:bg-white rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-[#231212] dark:text-white" />
              </div>
              <div>
                <Button
                  variant="secondary"
                  onClick={handleUploadClick}
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Click to upload your photo
                  </span>
                </Button>
                <input
                  ref={fileInputRef}
                  id="face-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-sm font-body text-black dark:text-white opacity-70 mt-2">
                  or drag and drop
                </p>
              </div>
              <p className="text-xs font-body text-black dark:text-white opacity-50">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {file && !recommendations && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Analyze & Get Recommendations
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 border-2 border-red-500 dark:border-red-400 rounded-md">
            <p className="text-red-800 dark:text-red-200 font-body">{error}</p>
          </div>
        )}
      </Card>

      {/* Results */}
      {recommendations && (
        <div className="space-y-8">
          {/* Face Analysis Summary */}
          <Card>
            <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white">
              Your Analysis
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-neutral-soft dark:bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-[#231212] dark:text-white" />
                  <h3 className="text-lg md:text-xl font-display text-[#231212] dark:text-white">
                    Skin Tone
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-black dark:text-white opacity-70">Category:</span>
                    <span className="font-body font-semibold text-[#231212] dark:text-white capitalize">
                      {recommendations.face_analysis.skin_tone.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-black dark:text-white opacity-70">Undertone:</span>
                    <span className="font-body font-semibold text-[#231212] dark:text-white">
                      {recommendations.face_analysis.skin_tone.undertone > 0 ? 'Warm' : 'Cool'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-black dark:text-white opacity-70">Luminance:</span>
                    <span className="font-body font-semibold text-[#231212] dark:text-white">
                      {recommendations.face_analysis.skin_tone.luminance.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Card>
              <Card className="bg-neutral-soft dark:bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#231212] dark:text-white" />
                  <h3 className="text-lg md:text-xl font-display text-[#231212] dark:text-white">
                    Face Shape
                  </h3>
                </div>
                <div className="text-center">
                  <span className="text-3xl md:text-4xl font-display font-bold capitalize text-[#231212] dark:text-white">
                    {recommendations.face_analysis.face_shape}
                  </span>
                </div>
              </Card>
            </div>
          </Card>

          {/* Style Tips */}
          <Card>
            <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white">
              Style Tips
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg md:text-xl font-display text-[#231212] dark:text-white mb-3">
                  Recommended Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendations.style_tips.colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#231212] dark:bg-white text-white dark:text-black rounded-full text-sm font-body"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-display text-[#231212] dark:text-white mb-3">
                  Face Shape Tips
                </h3>
                <div className="space-y-2">
                  {recommendations.style_tips.face_shape_tips.necklines && (
                    <div>
                      <span className="font-body font-semibold text-[#231212] dark:text-white">Necklines: </span>
                      <span className="font-body text-black dark:text-white opacity-70">
                        {recommendations.style_tips.face_shape_tips.necklines.join(', ')}
                      </span>
                    </div>
                  )}
                  {recommendations.style_tips.face_shape_tips.accessories && (
                    <div>
                      <span className="font-body font-semibold text-[#231212] dark:text-white">Accessories: </span>
                      <span className="font-body text-black dark:text-white opacity-70">
                        {recommendations.style_tips.face_shape_tips.accessories.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Get Outfit Recommendations Button */}
          <Card className="bg-[#231212] dark:bg-black text-white dark:text-white border-2 border-[#231212] dark:border-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-display mb-2">
                  Ready to Create Outfits?
                </h2>
                <p className="text-sm md:text-base font-body opacity-80">
                  Get AI-powered outfit compatibility recommendations using our Siamese MobileNetV2 model
                </p>
              </div>
              <Button
                onClick={handleGetOutfitRecommendations}
                variant="secondary"
                className="bg-white dark:bg-gray-800 text-[#231212] dark:text-white hover:bg-neutral-soft dark:hover:bg-gray-700 dark:border-white"
              >
                <span className="flex items-center gap-2">
                  Get Outfit Recommendations
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </Card>

          {/* Clothing Recommendations */}
          <Card>
            <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white">
              Clothing Recommendations (Ranked by Suitability)
            </h2>
            <div className="space-y-6">
              {recommendations.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  data-item-name={rec.item}
                  className="border-2 border-[#231212] dark:border-white rounded-md p-6 hover:shadow-xl transition-shadow duration-smooth"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-display text-black dark:text-white opacity-50">#{idx + 1}</span>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display text-[#231212] dark:text-white">{rec.item}</h3>
                        <p className="text-sm font-body text-black dark:text-white opacity-70 capitalize">{rec.thickness}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-display font-bold ${getScoreColor(rec.score)}`}>
                        {rec.score.toFixed(1)}
                      </div>
                      <div className="text-sm font-body text-black dark:text-white opacity-70">/ 10</div>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-soft dark:bg-white rounded-full h-3 overflow-hidden mb-6">
                    <div
                      className={`h-full ${getScoreBarColor(rec.score)} transition-all duration-500`}
                      style={{ width: `${(rec.score / 10) * 100}%` }}
                    />
                  </div>

                  {/* Wardrobe Items */}
                  {rec.wardrobe_items && rec.wardrobe_items.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg md:text-xl font-display text-[#231212] dark:text-white mb-3">
                        From Your Wardrobe ({rec.wardrobe_items.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {rec.wardrobe_items.map((item) => (
                          <a
                            key={item.id}
                            href={`/item/${item.id}`}
                            className="group"
                          >
                            <Card className="overflow-hidden p-0 hover:scale-105 transition-transform duration-smooth">
                              <div className="relative aspect-square bg-neutral-soft dark:bg-white">
                                <img
                                  src={wardrobeApi.getImageUrl(item.filename)}
                                  alt={item.class_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                                  }}
                                />
                                <div
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white dark:border-black shadow-md"
                                  style={{ backgroundColor: item.color_hex }}
                                  title={`Color: ${item.color_hex}`}
                                />
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-body font-medium text-[#231212] dark:text-white truncate">
                                  {item.class_name}
                                </p>
                                <p className="text-xs font-body text-black dark:text-white opacity-70">
                                  {Math.round(item.confidence * 100)}% match
                                </p>
                              </div>
                            </Card>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Web Recommendations (Lazy Loaded) */}
                  <div>
                    <h4 className="text-lg md:text-xl font-display text-[#231212] dark:text-white mb-3">
                      Shop Online
                    </h4>
                    {loadingWebRecs[rec.item] ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#231212] dark:text-white" />
                        <span className="ml-3 font-body text-black dark:text-white opacity-70">Loading recommendations...</span>
                      </div>
                    ) : webRecommendations[rec.item] && webRecommendations[rec.item].length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {webRecommendations[rec.item].map((product, pIdx) => (
                          <a
                            key={pIdx}
                            href={product.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <Card className="overflow-hidden p-0 hover:scale-105 transition-transform duration-smooth">
                              <div className="relative aspect-square bg-neutral-soft dark:bg-white">
                                {product.default_image && (
                                  <img
                                    src={`https://image.hm.com/${product.default_image}`}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="p-4">
                                <h5 className="font-body font-medium text-[#231212] dark:text-white mb-1 line-clamp-2 text-sm">
                                  {product.title}
                                </h5>
                                <p className="text-[#231212] dark:text-white font-body font-semibold text-sm mb-2">
                                  {product.price}
                                </p>
                                {product.colors && product.colors.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {product.colors.slice(0, 5).map((color, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="w-4 h-4 rounded-full border-2 border-white dark:border-white"
                                        title={color}
                                        style={{ backgroundColor: color.replace(/;$/, '') }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 font-body text-black dark:text-white opacity-70 text-sm">
                        No online recommendations available for this item
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

