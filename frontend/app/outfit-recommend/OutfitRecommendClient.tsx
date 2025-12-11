'use client';

// This page depends on query params and runtime API calls; avoid static prerender.
import { useState, useEffect } from 'react';
import { wardrobeApi, OutfitRecommendationResponse, Outfit } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

export default function OutfitRecommendClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCombinations, setTotalCombinations] = useState(0);

  useEffect(() => {
    const topIds = searchParams.get('top_ids')?.split(',') || [];
    const bottomIds = searchParams.get('bottom_ids')?.split(',') || [];

    if (topIds.length > 0 && bottomIds.length > 0) {
      loadOutfitRecommendations(topIds, bottomIds);
    } else {
      setError('Missing top or bottom item IDs');
    }
  }, [searchParams]);

  const loadOutfitRecommendations = async (topIds: string[], bottomIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const data = await wardrobeApi.getOutfitRecommendations(topIds, bottomIds);
      setOutfits(data.outfits);
      setTotalCombinations(data.total_combinations);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load outfit recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCompatibilityBarColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="w-12 h-12 animate-spin text-[#231212] dark:text-white mb-4" />
          <p className="text-base font-body text-black dark:text-white opacity-70">Analyzing outfit compatibility...</p>
          <p className="text-sm font-body text-black dark:text-white opacity-50 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <Card className="border-red-500 dark:border-red-500">
          <h2 className="text-xl md:text-2xl font-display text-red-800 dark:text-red-400 mb-2">Error</h2>
          <p className="font-body text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/face-recommend')}>
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Face Recommendations
            </span>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-2 text-[#231212] dark:text-white">
              Outfit Compatibility Recommendations
            </h1>
            <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70">
              Best outfit pairs ranked by AI compatibility score
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push('/face-recommend')}
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </span>
          </Button>
        </div>
        {totalCombinations > 0 && (
          <p className="text-sm font-body text-black dark:text-white opacity-70">
            Analyzed {totalCombinations} combinations
          </p>
        )}
      </div>

      {outfits.length === 0 ? (
        <Card className="text-center py-12 md:py-16">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-black dark:text-white opacity-30" />
          <p className="text-lg md:text-xl font-body text-black dark:text-white opacity-70">
            No outfit recommendations available
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {outfits.map((outfit, idx) => (
            <Card key={idx} className="overflow-hidden p-0 hover:shadow-xl transition-shadow duration-smooth">
              {/* Outfit Pair */}
              <div className="grid grid-cols-2 gap-2 p-2">
                {/* Top Item */}
                <a href={`/item/${outfit.top.id}`} className="group">
                  <div className="relative aspect-square bg-neutral-soft dark:bg-white rounded-md overflow-hidden">
                    <img
                      src={wardrobeApi.getImageUrl(outfit.top.filename)}
                      alt={outfit.top.class_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-smooth"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-white dark:bg-black bg-opacity-75 dark:bg-opacity-75 px-2 py-1 rounded text-xs font-body font-semibold text-[#231212] dark:text-white">
                      TOP
                    </div>
                    <div
                      className="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-black shadow-md"
                      style={{ backgroundColor: outfit.top.color_hex }}
                      title={`Color: ${outfit.top.color_hex}`}
                    />
                  </div>
                  <div className="mt-1 px-1">
                    <p className="text-xs font-body font-medium text-[#231212] dark:text-white truncate">
                      {outfit.top.class_name}
                    </p>
                  </div>
                </a>

                {/* Bottom Item */}
                <a href={`/item/${outfit.bottom.id}`} className="group">
                  <div className="relative aspect-square bg-neutral-soft dark:bg-white rounded-md overflow-hidden">
                    <img
                      src={wardrobeApi.getImageUrl(outfit.bottom.filename)}
                      alt={outfit.bottom.class_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-smooth"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Not+Found';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-white dark:bg-black bg-opacity-75 dark:bg-opacity-75 px-2 py-1 rounded text-xs font-body font-semibold text-[#231212] dark:text-white">
                      BOTTOM
                    </div>
                    <div
                      className="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-black shadow-md"
                      style={{ backgroundColor: outfit.bottom.color_hex }}
                      title={`Color: ${outfit.bottom.color_hex}`}
                    />
                  </div>
                  <div className="mt-1 px-1">
                    <p className="text-xs font-body font-medium text-[#231212] dark:text-white truncate">
                      {outfit.bottom.class_name}
                    </p>
                  </div>
                </a>
              </div>

              {/* Compatibility Score */}
              <div className="p-4 border-t-2 border-[#231212] dark:border-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body font-medium text-black dark:text-white opacity-70">Compatibility</span>
                  <span className={`text-lg md:text-xl font-display font-bold ${getCompatibilityColor(outfit.compatibility_score)}`}>
                    {(outfit.compatibility_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-soft dark:bg-white rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full ${getCompatibilityBarColor(outfit.compatibility_score)} transition-all duration-500`}
                    style={{ width: `${outfit.compatibility_score * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-body text-black dark:text-white opacity-70">
                  <span>Rank #{idx + 1}</span>
                  <span className="capitalize">{outfit.top.thickness} + {outfit.bottom.thickness}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

