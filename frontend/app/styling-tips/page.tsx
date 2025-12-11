'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import { BookOpen, Palette, Layers, Heart, TrendingUp, Lightbulb } from 'lucide-react';

interface TipCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  tips: { title: string; content: string }[];
}

const tipCategories: TipCategory[] = [
  {
    id: 'color',
    title: 'Color Coordination',
    icon: <Palette className="w-6 h-6" />,
    tips: [
      {
        title: 'Complementary Colors',
        content: 'Pair colors opposite each other on the color wheel (e.g., blue and orange, red and green) for a bold, eye-catching look.',
      },
      {
        title: 'Monochromatic Styling',
        content: 'Use different shades of the same color for a sophisticated, cohesive outfit. This creates visual harmony and elongates your silhouette.',
      },
      {
        title: 'Neutral Base',
        content: 'Start with neutral colors (black, white, gray, beige) as your base, then add pops of color with accessories or statement pieces.',
      },
      {
        title: 'Color Temperature',
        content: 'Stick to either warm tones (reds, oranges, yellows) or cool tones (blues, greens, purples) within one outfit for better harmony.',
      },
    ],
  },
  {
    id: 'pattern',
    title: 'Pattern Mixing',
    icon: <Layers className="w-6 h-6" />,
    tips: [
      {
        title: 'Scale Variation',
        content: 'Mix patterns of different sizes - pair a large floral print with a small stripe or polka dot. This creates visual interest without overwhelming.',
      },
      {
        title: 'Color Connection',
        content: 'When mixing patterns, ensure they share at least one common color. This creates a cohesive look even with different pattern styles.',
      },
      {
        title: 'Pattern + Solid',
        content: 'Balance a bold pattern with solid colors. If you\'re wearing a patterned top, pair it with solid bottoms and vice versa.',
      },
      {
        title: 'Start Small',
        content: 'Begin with subtle patterns like pinstripes or small dots, then gradually experiment with bolder combinations as you gain confidence.',
      },
    ],
  },
  {
    id: 'body',
    title: 'Body Type Styling',
    icon: <Heart className="w-6 h-6" />,
    tips: [
      {
        title: 'Hourglass Figure',
        content: 'Emphasize your waist with belts and fitted styles. A-line dresses and wrap tops work beautifully to highlight your balanced proportions.',
      },
      {
        title: 'Pear Shape',
        content: 'Draw attention upward with statement necklaces, bright tops, and darker bottoms. A-line skirts and wide-leg pants balance your silhouette.',
      },
      {
        title: 'Apple Shape',
        content: 'Create definition with V-necks and empire waistlines. Flowy tops that skim your body and structured jackets create a flattering shape.',
      },
      {
        title: 'Rectangle Shape',
        content: 'Create curves with peplum tops, belted dresses, and A-line skirts. Add volume to create the illusion of a defined waist.',
      },
    ],
  },
  {
    id: 'layering',
    title: 'Layering Techniques',
    icon: <Layers className="w-6 h-6" />,
    tips: [
      {
        title: 'Texture Mixing',
        content: 'Combine different textures (silk, denim, knit, leather) for depth and interest. A chunky knit over a silk blouse creates visual contrast.',
      },
      {
        title: 'Length Variation',
        content: 'Layer pieces of different lengths - a longer cardigan over a shorter top, or a long coat over a mid-length dress creates dimension.',
      },
      {
        title: 'Color Progression',
        content: 'Layer from light to dark or vice versa. This creates a natural flow and makes your outfit look intentional and polished.',
      },
      {
        title: 'Functional Layers',
        content: 'Choose layers that can be easily removed. A blazer over a blouse, or a cardigan over a tee, gives you flexibility throughout the day.',
      },
    ],
  },
  {
    id: 'accessories',
    title: 'Accessorizing',
    icon: <Lightbulb className="w-6 h-6" />,
    tips: [
      {
        title: 'Statement Piece',
        content: 'Choose one statement accessory (bold necklace, colorful bag, or eye-catching shoes) and keep the rest minimal to avoid overwhelming your look.',
      },
      {
        title: 'Proportion Matters',
        content: 'Match accessory size to your body frame. Petite frames suit delicate jewelry, while larger frames can carry bold, chunky pieces.',
      },
      {
        title: 'Shoe Coordination',
        content: 'Match your shoe color to your outfit\'s color scheme, or use neutral shoes (black, nude, tan) that go with everything for versatility.',
      },
      {
        title: 'Bag Selection',
        content: 'Choose a bag size appropriate for your frame and the occasion. A small crossbody for casual outings, a structured tote for work.',
      },
    ],
  },
  {
    id: 'seasonal',
    title: 'Seasonal Styling',
    icon: <TrendingUp className="w-6 h-6" />,
    tips: [
      {
        title: 'Spring Transitions',
        content: 'Layer light pieces - a trench coat over a blouse, or a cardigan over a dress. Incorporate pastels and florals for a fresh look.',
      },
      {
        title: 'Summer Essentials',
        content: 'Choose breathable fabrics like cotton, linen, and lightweight synthetics. Light colors reflect heat, while loose fits allow air circulation.',
      },
      {
        title: 'Fall Layering',
        content: 'Combine textures - a chunky sweater with a leather jacket, or a silk scarf with a wool coat. Rich, warm colors complement the season.',
      },
      {
        title: 'Winter Warmth',
        content: 'Layer thermal pieces under your clothes, choose wool and cashmere for warmth, and don\'t forget a quality coat and boots for protection.',
      },
    ],
  },
];

export default function StylingTipsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center">
        <div className="flex justify-center mb-4">
          <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-[#231212] dark:text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Styling Tips & Education
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70 max-w-2xl mx-auto">
          Learn color coordination, pattern mixing, and styling techniques to elevate your wardrobe
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
        {tipCategories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all duration-smooth ${
              selectedCategory === category.id
                ? 'border-[#231212] dark:border-white bg-[#231212] dark:bg-white'
                : 'hover:scale-105'
            }`}
            onClick={() => setSelectedCategory(
              selectedCategory === category.id ? null : category.id
            )}
          >
            <div className={`flex items-center gap-3 mb-3 ${
              selectedCategory === category.id
                ? 'text-white dark:text-black'
                : 'text-[#231212] dark:text-white'
            }`}>
              {category.icon}
              <h2 className="text-xl md:text-2xl font-display">
                {category.title}
              </h2>
            </div>
            <p className={`text-sm font-body ${
              selectedCategory === category.id
                ? 'text-white dark:text-black opacity-80'
                : 'text-black dark:text-white opacity-70'
            }`}>
              {category.tips.length} tips
            </p>
          </Card>
        ))}
      </div>

      {/* Tips Display */}
      {selectedCategory && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-display text-[#231212] dark:text-white">
              {tipCategories.find(c => c.id === selectedCategory)?.title}
            </h2>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-body text-black dark:text-white opacity-70 hover:opacity-100"
            >
              Close
            </button>
          </div>
          {tipCategories
            .find(c => c.id === selectedCategory)
            ?.tips.map((tip, index) => (
              <Card key={index}>
                <h3 className="text-xl md:text-2xl font-display mb-3 text-[#231212] dark:text-white">
                  {tip.title}
                </h3>
                <p className="text-base md:text-lg font-body text-black dark:text-white opacity-80 leading-relaxed">
                  {tip.content}
                </p>
              </Card>
            ))}
        </div>
      )}

      {/* All Tips View (when no category selected) */}
      {!selectedCategory && (
        <div className="space-y-8">
          {tipCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                {category.icon}
                <h2 className="text-2xl md:text-3xl font-display text-[#231212] dark:text-white">
                  {category.title}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.tips.map((tip, index) => (
                  <Card key={index}>
                    <h3 className="text-lg md:text-xl font-display mb-2 text-[#231212] dark:text-white">
                      {tip.title}
                    </h3>
                    <p className="text-sm md:text-base font-body text-black dark:text-white opacity-80">
                      {tip.content}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

