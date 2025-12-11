'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { wardrobeApi, WardrobeItem } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, Tag, Palette, Layers, Calendar } from 'lucide-react';

export default function ItemDetailClient() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadItem(params.id as string);
    }
  }, [params.id]);

  const loadItem = async (id: string) => {
    try {
      setLoading(true);
      const data = await wardrobeApi.getItem(id);
      setItem(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Item not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#231212] dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
        <Card className="border-red-500 dark:border-red-500">
          <p className="text-red-800 dark:text-red-400 font-body mb-4">{error || 'Item not found'}</p>
          <Button variant="secondary" onClick={() => router.push('/wardrobe')}>
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Wardrobe
            </span>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      <Button
        variant="secondary"
        onClick={() => router.back()}
        className="mb-6"
      >
        <span className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </span>
      </Button>

      <Card>
        <div>
          {/* Details */}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-display mb-6 text-[#231212] dark:text-white capitalize">
              {item.class_name}
            </h1>

            <div className="space-y-6">
              {/* Confidence */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-5 h-5 text-[#231212] dark:text-white" />
                  <label className="text-sm font-body font-semibold text-black dark:text-white opacity-70">
                    Classification Confidence
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-neutral-soft dark:bg-white rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#231212] dark:bg-white h-3 rounded-full transition-all duration-smooth"
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-base font-body font-semibold text-[#231212] dark:text-white min-w-[3rem] text-right">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Color */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-[#231212] dark:text-white" />
                  <label className="text-sm font-body font-semibold text-black dark:text-white opacity-70">
                    Dominant Color
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-md border-2 border-[#231212] dark:border-white shadow-md"
                    style={{ backgroundColor: item.color_hex }}
                    title={item.color_hex}
                  />
                  <div>
                    <p className="text-base font-body font-mono text-[#231212] dark:text-white">
                      {item.color_hex.toUpperCase()}
                    </p>
                    <p className="text-sm font-body text-black dark:text-white opacity-70">
                      RGB values extracted from image
                    </p>
                  </div>
                </div>
              </div>

              {/* Thickness */}
              {item.thickness && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-[#231212] dark:text-white" />
                    <label className="text-sm font-body font-semibold text-black dark:text-white opacity-70">
                      Fabric Thickness
                    </label>
                  </div>
                  <p className="text-base font-body font-semibold text-[#231212] dark:text-white capitalize">
                    {item.thickness}
                  </p>
                </div>
              )}

              {/* Created At */}
              {item.created_at && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#231212] dark:text-white" />
                    <label className="text-sm font-body font-semibold text-black dark:text-white opacity-70">
                      Added to Wardrobe
                    </label>
                  </div>
                  <p className="text-base font-body text-[#231212] dark:text-white">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

