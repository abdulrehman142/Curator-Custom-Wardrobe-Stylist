'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { wardrobeApi, WardrobeItem } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Upload, Search, Filter, X, Shirt, Tag } from 'lucide-react';

export default function WardrobeClient() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedThickness, setSelectedThickness] = useState<string>('all');
  const [displayImages, setDisplayImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      setLoading(true);
      const data = await wardrobeApi.getWardrobe(200);
      setItems(data);
      
      // Load display images for all unique categories
      const categories = new Set(data.map(item => item.class_name.toLowerCase()));
      const images: Record<string, string[]> = {};
      
      for (const category of categories) {
        try {
          const result = await wardrobeApi.listDisplayImages(category);
          images[category] = result.images;
        } catch (err) {
          images[category] = [];
        }
      }
      
      setDisplayImages(images);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories, colors, and thicknesses
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.class_name.toLowerCase()));
    return ['all', ...Array.from(cats)].sort();
  }, [items]);

  const colors = useMemo(() => {
    const cols = new Set(items.map(item => item.color_hex));
    return ['all', ...Array.from(cols)];
  }, [items]);

  const thicknesses = useMemo(() => {
    const thicks = new Set(items.map(item => item.thickness).filter(Boolean));
    return ['all', ...Array.from(thicks)];
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color_hex.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        item.class_name.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesColor = selectedColor === 'all' || 
        item.color_hex.toLowerCase() === selectedColor.toLowerCase();
      
      const matchesThickness = selectedThickness === 'all' || 
        item.thickness === selectedThickness;

      return matchesSearch && matchesCategory && matchesColor && matchesThickness;
    });
  }, [items, searchQuery, selectedCategory, selectedColor, selectedThickness]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedColor('all');
    setSelectedThickness('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || 
    selectedColor !== 'all' || selectedThickness !== 'all';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#231212] dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <Card className="border-red-500 dark:border-red-500">
          <p className="text-red-800 dark:text-red-400 font-body">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-2 text-[#231212] dark:text-white">
              My Wardrobe
            </h1>
            <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70">
              {items.length} item{items.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>
          <Button onClick={() => router.push('/')}>
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Add Item
            </span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black dark:text-white opacity-50" />
              <Input
                type="text"
                placeholder="Search by name, category, or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-2 md:gap-4">
              {/* Category Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-body mb-1 text-black dark:text-white opacity-70">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-full"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-body mb-1 text-black dark:text-white opacity-70">
                  Color
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="input-field w-full"
                >
                  {colors.map(color => (
                    <option key={color} value={color}>
                      {color === 'all' ? 'All Colors' : color.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thickness Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-body mb-1 text-black dark:text-white opacity-70">
                  Thickness
                </label>
                <select
                  value={selectedThickness}
                  onChange={(e) => setSelectedThickness(e.target.value)}
                  className="input-field w-full"
                >
                  {thicknesses.map(thick => (
                    <option key={thick} value={thick}>
                      {thick === 'all' ? 'All' : thick.charAt(0).toUpperCase() + thick.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="mb-4">
          <p className="text-sm font-body text-black dark:text-white opacity-70">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>
      )}

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12 md:py-16">
          <Shirt className="w-16 h-16 mx-auto mb-4 text-black dark:text-white opacity-30" />
          <p className="text-lg md:text-xl font-body text-black dark:text-white opacity-70 mb-4">
            {hasActiveFilters ? 'No items match your filters' : 'Your wardrobe is empty'}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => router.push('/')}>
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Your First Item
              </span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item, idx) => {
            const categoryLower = item.class_name.toLowerCase();
            const images = displayImages[categoryLower] || [];
            const displayImage = images.length > 0 ? images[idx % images.length] : null;
            
            return (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-smooth"
                onClick={() => router.push(`/item/${item.id}`)}
              >
                {displayImage && (
                  <div className="relative aspect-square bg-neutral-soft dark:bg-white mb-4">
                    <Image
                      src={wardrobeApi.getDisplayImageUrl(categoryLower, displayImage)}
                      alt={item.class_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      priority={idx < 4}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display text-lg md:text-xl text-[#231212] dark:text-white capitalize">
                    {item.class_name}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm font-body text-black dark:text-white opacity-70">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {Math.round(item.confidence * 100)}% match
                  </span>
                  {item.thickness && (
                    <span className="capitalize">{item.thickness}</span>
                  )}
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

