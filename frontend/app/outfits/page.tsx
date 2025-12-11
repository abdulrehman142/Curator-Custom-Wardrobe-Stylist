'use client';

import { useState, useEffect } from 'react';
import { wardrobeApi, WardrobeItem, Recommendation } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Sparkles, Cloud, Thermometer, Wind, MapPin, RefreshCw } from 'lucide-react';

export default function OutfitsPage() {
  const [city, setCity] = useState('Lahore');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stylePreferences, setStylePreferences] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    // Load saved style preferences
    const saved = localStorage.getItem('stylePreferences');
    if (saved) {
      try {
        setStylePreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse style preferences', e);
      }
    }
  }, []);

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wardrobeApi.getRecommendations(city);
      setRecommendation(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

    const renderItem = (item: WardrobeItem | null, label: string) => {
    if (!item) return null;
    return (
      <Card className="text-center">
        <div className="relative aspect-square bg-neutral-soft dark:bg-white mb-4 rounded-md overflow-hidden">
          <img
            src={wardrobeApi.getImageUrl(item.filename)}
            alt={item.class_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
            }}
          />
        </div>
        <h3 className="font-display text-lg text-[#231212] dark:text-white capitalize mb-1">
          {label}
        </h3>
        <p className="text-sm font-body text-black dark:text-white opacity-70 capitalize">
          {item.class_name}
        </p>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Outfit Recommendations
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70 max-w-2xl mx-auto">
          Get AI-powered outfit suggestions based on your wardrobe, weather, and style preferences
        </p>
      </div>

      {/* Style Preferences Banner */}
      {stylePreferences && (
        <Card className="mb-6 bg-neutral-soft dark:bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#231212] dark:text-black" />
            <h3 className="font-display text-lg text-[#231212] dark:text-black">
              Personalized for You
            </h3>
          </div>
          <p className="text-sm font-body text-black dark:text-white opacity-70">
            Recommendations are tailored to your style preferences from the quiz.
          </p>
        </Card>
      )}

      {/* Location Input */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              label="City"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
            />
          </div>
          <Button onClick={handleGetRecommendations} disabled={loading}>
            <span className="flex items-center gap-2">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Recommendations
                </>
              )}
            </span>
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-500 dark:border-red-500">
          <p className="text-red-800 dark:text-red-400 font-body">{error}</p>
        </Card>
      )}

      {/* Recommendations */}
      {recommendation && (
        <div className="space-y-8">
          {/* Weather Info */}
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <MapPin className="w-6 h-6 text-[#231212] dark:text-white" />
              <h2 className="text-2xl md:text-3xl font-display text-[#231212] dark:text-white">
                {city}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-[#231212] dark:text-white" />
                <div>
                  <p className="text-xs font-body text-black dark:text-white opacity-50">Temperature</p>
                  <p className="text-lg font-body font-semibold text-[#231212] dark:text-white">
                    {recommendation.weather.temp_c}°C
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-[#231212] dark:text-white" />
                <div>
                  <p className="text-xs font-body text-black dark:text-white opacity-50">Condition</p>
                  <p className="text-lg font-body font-semibold text-[#231212] dark:text-white capitalize">
                    {recommendation.weather.main}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Suggested Outfit */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white">
              Suggested Outfit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
              {renderItem(recommendation.suggestion.shirt, 'Top')}
              {renderItem(recommendation.suggestion.pant, 'Bottom')}
              {renderItem(recommendation.suggestion.outer, 'Outerwear')}
            </div>
          </div>

          {/* Styling Notes */}
          {recommendation.notes && recommendation.notes.length > 0 && (
            <Card>
              <h3 className="text-xl md:text-2xl font-display mb-4 text-[#231212] dark:text-white">
                Styling Tips
              </h3>
              <ul className="space-y-2">
                {recommendation.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#231212] dark:text-white mt-1">•</span>
                    <p className="text-base font-body text-black dark:text-white opacity-80">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Alternative Recommendations */}
          {recommendation.recommendations && (
            <div>
              <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white">
                Alternative Options
              </h2>
              <div className="space-y-6">
                {Object.entries(recommendation.recommendations).map(([category, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={category}>
                      <h3 className="text-xl font-display mb-4 text-[#231212] dark:text-white capitalize">
                        {category}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {items.map((ratedItem, index) => (
                          <Card key={index} className="text-center">
                            <div className="relative aspect-square bg-neutral-soft dark:bg-white mb-2 rounded-md overflow-hidden">
                              <img
                                src={wardrobeApi.getImageUrl(ratedItem.item.filename)}
                                alt={ratedItem.item.class_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs font-body text-black dark:text-white opacity-70 mb-1">
                              {Math.round(ratedItem.weather_score * 100)}% match
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!recommendation && !loading && (
        <Card className="text-center py-12 md:py-16">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-black dark:text-white opacity-30" />
          <p className="text-lg md:text-xl font-body text-black dark:text-white opacity-70 mb-4">
            Enter your city to get personalized outfit recommendations
          </p>
        </Card>
      )}
    </div>
  );
}

