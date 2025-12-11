'use client';

import { useState, useEffect } from 'react';
import { wardrobeApi, WardrobeItem, WebRecommendations } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ShoppingBag, ExternalLink, Search, TrendingUp, Sparkles } from 'lucide-react';

export default function ShoppingPage() {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<WebRecommendations | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      setLoading(true);
      const data = await wardrobeApi.getWardrobe(100);
      setWardrobeItems(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item from your wardrobe');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await wardrobeApi.getWebRecommendations(selectedItems);
      setRecommendations(data.web_recommendations);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get shopping recommendations');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const getGapItems = () => {
    // Analyze wardrobe to suggest gap items
    const categories = new Set(wardrobeItems.map(item => item.class_name.toLowerCase()));
    const gapSuggestions = [];

    if (!categories.has('shirt') && !categories.has('t-shirt')) {
      gapSuggestions.push({ name: 'Basic T-Shirt', reason: 'Essential wardrobe staple' });
    }
    if (!categories.has('pants') && !categories.has('jeans')) {
      gapSuggestions.push({ name: 'Classic Jeans', reason: 'Versatile bottom option' });
    }
    if (!categories.has('jacket') && !categories.has('blazer')) {
      gapSuggestions.push({ name: 'Blazer', reason: 'Perfect for layering' });
    }
    if (!categories.has('dress')) {
      gapSuggestions.push({ name: 'Little Black Dress', reason: 'Timeless classic' });
    }

    return gapSuggestions;
  };

  const gapItems = getGapItems();

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Shopping Assistant
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70 max-w-2xl mx-auto">
          Discover gap items to complete your wardrobe and find pieces that match your style
        </p>
      </div>

      {/* Gap Items Suggestions */}
      {gapItems.length > 0 && (
        <Card className="mb-8 bg-neutral-soft">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#231212] dark:text-white" />
            <h2 className="text-xl md:text-2xl font-display text-[#231212] dark:text-white">
              Suggested Gap Items
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gapItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-black rounded-md border-2 border-[#231212] dark:border-white">
                <div>
                  <p className="font-body font-semibold text-[#231212] dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm font-body text-black dark:text-white opacity-70">
                    {item.reason}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedItems([item.name]);
                    setTimeout(() => handleGetRecommendations(), 100);
                  }}
                >
                  Find
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Wardrobe Selection */}
      <Card className="mb-8">
        <h2 className="text-xl md:text-2xl font-display mb-4 text-[#231212] dark:text-white">
          Select Items to Find Similar Pieces
        </h2>
        <p className="text-sm font-body text-black dark:text-white opacity-70 mb-4">
          Choose items from your wardrobe to find matching or complementary pieces
        </p>
        
        {loading && wardrobeItems.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#231212] dark:border-white"></div>
          </div>
        ) : wardrobeItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-black dark:text-white opacity-30" />
            <p className="text-base font-body text-black dark:text-white opacity-70 mb-4">
              Your wardrobe is empty. Add items to get shopping recommendations.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Add Items to Wardrobe
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4 max-h-64 overflow-y-auto">
              {wardrobeItems.map((item) => {
                const isSelected = selectedItems.includes(item.class_name);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItemSelection(item.class_name)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all duration-smooth ${
                      isSelected
                        ? 'border-[#231212] dark:border-white ring-2 ring-[#231212] dark:ring-white'
                        : 'border-white dark:border-white hover:border-[#231212] dark:hover:border-white'
                    }`}
                  >
                    <img
                      src={wardrobeApi.getImageUrl(item.filename)}
                      alt={item.class_name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#231212] dark:bg-white bg-opacity-30 flex items-center justify-center">
                        <div className="w-6 h-6 bg-[#231212] dark:bg-white rounded-full flex items-center justify-center">
                          <span className="text-white dark:text-black text-xs font-bold">✓</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                      <p className="text-xs font-body text-white truncate capitalize">
                        {item.class_name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={handleGetRecommendations}
              disabled={loading || selectedItems.length === 0}
              className="w-full md:w-auto"
            >
              <span className="flex items-center gap-2 justify-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find Similar Items
                  </>
                )}
              </span>
            </Button>
          </>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-red-500 dark:border-red-500">
          <p className="text-red-800 dark:text-red-400 font-body">{error}</p>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && Object.keys(recommendations).length > 0 && (
        <div className="space-y-8">
          {Object.entries(recommendations).map(([itemName, products]) => (
            <div key={itemName}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#231212] dark:text-white" />
                <h2 className="text-xl md:text-2xl font-display text-[#231212] dark:text-white capitalize">
                  Similar to: {itemName}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product, index) => (
                  <Card key={index}>
                    {product.default_image && (
                      <div className="relative aspect-square bg-neutral-soft dark:bg-white mb-4 rounded-md overflow-hidden">
                        <img
                          src={product.default_image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-display mb-2 text-[#231212] dark:text-white line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-base font-body font-semibold text-[#231212] dark:text-white">
                        {product.price}
                      </p>
                      <span className="text-xs font-body text-black dark:text-white opacity-70 capitalize">
                        {product.category}
                      </span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {product.colors.slice(0, 5).map((color, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-white"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                    {product.link && (
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                          View Product
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Recommendations State */}
      {recommendations && Object.keys(recommendations).length === 0 && (
        <Card className="text-center py-12 md:py-16">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-black dark:text-white opacity-30" />
          <p className="text-lg md:text-xl font-body text-black dark:text-white opacity-70">
            No recommendations found. Try selecting different items.
          </p>
        </Card>
      )}
    </div>
  );
}

