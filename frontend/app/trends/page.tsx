'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import { TrendingUp, Sparkles, Clock, Star } from 'lucide-react';

interface Trend {
  id: string;
  title: string;
  description: string;
  category: 'color' | 'pattern' | 'style' | 'accessory';
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  timeless: boolean;
  tips: string[];
}

const currentTrends: Trend[] = [
  {
    id: '1',
    title: 'Oversized Blazers',
    description: 'Structured, roomy blazers that add sophistication to any outfit',
    category: 'style',
    season: 'all',
    timeless: false,
    tips: [
      'Pair with fitted bottoms to balance the volume',
      'Works great over dresses, t-shirts, or button-downs',
      'Choose neutral colors for maximum versatility',
    ],
  },
  {
    id: '2',
    title: 'Sage Green',
    description: 'Soft, muted green that brings calm and sophistication',
    category: 'color',
    season: 'spring',
    timeless: false,
    tips: [
      'Pairs beautifully with cream, beige, and white',
      'Works well in both casual and formal settings',
      'Complements warm and cool skin tones',
    ],
  },
  {
    id: '3',
    title: 'Wide-Leg Pants',
    description: 'Comfortable and stylish, these pants are making a comeback',
    category: 'style',
    season: 'all',
    timeless: true,
    tips: [
      'Balance with fitted tops to avoid looking boxy',
      'High-waisted styles elongate the legs',
      'Perfect for both work and casual occasions',
    ],
  },
  {
    id: '4',
    title: 'Puff Sleeves',
    description: 'Romantic and feminine, adding volume at the shoulders',
    category: 'style',
    season: 'spring',
    timeless: false,
    tips: [
      'Great for creating an hourglass silhouette',
      'Pair with simple bottoms to let the sleeves shine',
      'Choose lightweight fabrics for comfort',
    ],
  },
  {
    id: '5',
    title: 'Chunky Gold Jewelry',
    description: 'Bold, statement pieces that add instant glamour',
    category: 'accessory',
    season: 'all',
    timeless: true,
    tips: [
      'Mix with delicate pieces for contrast',
      'One statement piece is usually enough',
      'Works with both casual and formal outfits',
    ],
  },
  {
    id: '6',
    title: 'Terracotta & Rust',
    description: 'Warm, earthy tones perfect for fall and winter',
    category: 'color',
    season: 'fall',
    timeless: false,
    tips: [
      'Complements olive green and navy beautifully',
      'Adds warmth to neutral palettes',
      'Perfect for cozy, layered looks',
    ],
  },
  {
    id: '7',
    title: 'Plaid Patterns',
    description: 'Classic patterns with modern twists',
    category: 'pattern',
    season: 'fall',
    timeless: true,
    tips: [
      'Mix with solid colors to avoid overwhelming',
      'Choose one plaid piece per outfit',
      'Works in both casual and professional settings',
    ],
  },
  {
    id: '8',
    title: 'Minimalist Sneakers',
    description: 'Clean, simple sneakers that go with everything',
    category: 'accessory',
    season: 'all',
    timeless: true,
    tips: [
      'White or neutral colors are most versatile',
      'Perfect for transitioning from day to night',
      'Comfortable alternative to heels',
    ],
  },
];

export default function TrendsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTimelessOnly, setShowTimelessOnly] = useState(false);

  const filteredTrends = currentTrends.filter(trend => {
    const matchesSeason = selectedSeason === 'all' || trend.season === selectedSeason;
    const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
    const matchesTimeless = !showTimelessOnly || trend.timeless;
    return matchesSeason && matchesCategory && matchesTimeless;
  });

  const seasons = ['all', 'spring', 'summer', 'fall', 'winter'];
  const categories = ['all', 'color', 'pattern', 'style', 'accessory'];

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center">
        <div className="flex justify-center mb-4">
          <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-[#231212] dark:text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Trends & Inspiration
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70 max-w-2xl mx-auto">
          Stay updated with current fashion trends aligned with your personal style preferences
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-body mb-2 text-black dark:text-white opacity-70">
              Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="input-field w-full"
            >
              {seasons.map(season => (
                <option key={season} value={season}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-body mb-2 text-black dark:text-white opacity-70">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field w-full"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTimelessOnly}
                onChange={(e) => setShowTimelessOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-body text-black dark:text-white">
                Show timeless pieces only
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Trends Grid */}
      {filteredTrends.length === 0 ? (
        <Card className="text-center py-12 md:py-16">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-black dark:text-white opacity-30" />
          <p className="text-lg md:text-xl font-body text-black dark:text-white opacity-70">
            No trends match your filters. Try adjusting your selections.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredTrends.map((trend) => (
            <Card key={trend.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-display text-[#231212] dark:text-white">
                    {trend.title}
                  </h2>
                  {trend.timeless && (
                    <span className="flex items-center" aria-label="Timeless">
                      <Star className="w-5 h-5 text-[#231212] dark:text-white" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-body text-black dark:text-black opacity-50 capitalize px-2 py-1 bg-neutral-soft dark:bg-white rounded-md">
                  {trend.category}
                </span>
              </div>
              <p className="text-base font-body text-black dark:text-white opacity-80 mb-4">
                {trend.description}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-black dark:text-white opacity-50" />
                <span className="text-sm font-body text-black dark:text-white opacity-70 capitalize">
                  {trend.season}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-body font-semibold text-[#231212] dark:text-white mb-2">
                  Styling Tips:
                </h3>
                <ul className="space-y-1">
                  {trend.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#231212] dark:text-white mt-1">•</span>
                      <p className="text-sm font-body text-black dark:text-white opacity-70">
                        {tip}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inspiration Section */}
      <div className="mt-12 md:mt-16">
        <h2 className="text-2xl md:text-3xl font-display mb-6 text-[#231212] dark:text-white text-center">
          Style Philosophy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-display mb-3 text-[#231212] dark:text-white">
              Timeless vs. Trendy
            </h3>
            <p className="text-base font-body text-black dark:text-white opacity-80 leading-relaxed">
              Invest in timeless pieces (classic cuts, neutral colors, quality fabrics) that form the foundation of your wardrobe. 
              Add trendy items as accents to keep your style current without breaking the bank.
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-display mb-3 text-[#231212] dark:text-white">
              Personal Style First
            </h3>
            <p className="text-base font-body text-black dark:text-white opacity-80 leading-relaxed">
              Not every trend will suit your personal style, body type, or lifestyle. Choose trends that align with who you are 
              and what makes you feel confident. Your personal style should always come first.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

