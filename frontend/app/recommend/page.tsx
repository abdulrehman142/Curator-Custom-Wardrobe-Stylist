'use client';

import { useState, useEffect } from 'react';
import { wardrobeApi, Recommendation, WardrobeItem, RatedItem } from '@/lib/api';
import Link from 'next/link';

export default function RecommendPage() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('Lahore');
  const [openweatherKey, setOpenweatherKey] = useState('bd0dd777f70a02fe533f982a20ffb047');

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wardrobeApi.getRecommendations(city, openweatherKey);
      setRecommendation(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const renderItem = (item: WardrobeItem | null, type: string) => {
    if (!item) {
      return (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-gray-500">No {type} available</p>
        </div>
      );
    }

    return (
      <Link
        href={`/item/${item.id}`}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
      >
        <div className="relative aspect-square bg-gray-100">
          <img
            src={wardrobeApi.getImageUrl(item.filename)}
            alt={item.class_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
            }}
          />
          <div
            className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: item.color_hex }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 capitalize mb-1">
            {item.class_name}
          </h3>
          <p className="text-sm text-gray-500">
            {Math.round(item.confidence * 100)}% confidence
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Outfit Recommendations
        </h1>
        <p className="text-gray-600">
          Get personalized outfit suggestions based on weather conditions
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter city name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenWeather API Key
            </label>
            <input
              type="text"
              value={openweatherKey}
              onChange={(e) => setOpenweatherKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="API Key"
            />
          </div>
        </div>
        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Recommendations */}
      {recommendation && !loading && (
        <div className="space-y-8">
          {/* Weather Info */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Current Weather</h2>
                <p className="text-primary-100 capitalize">
                  {recommendation.weather.main}
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold">
                  {Math.round(recommendation.weather.temp_c)}°C
                </p>
                <p className="text-primary-100">Temperature</p>
              </div>
            </div>
          </div>

          {/* Outfit Suggestions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recommended Outfit
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Shirt */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Top
                </h3>
                {renderItem(recommendation.suggestion.shirt, 'shirt')}
              </div>

              {/* Pant */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Bottom
                </h3>
                {renderItem(recommendation.suggestion.pant, 'pant')}
              </div>

              {/* Outer */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Outerwear
                </h3>
                {recommendation.suggestion.outer ? (
                  typeof recommendation.suggestion.outer === 'object' && 'id' in recommendation.suggestion.outer
                    ? renderItem(recommendation.suggestion.outer as WardrobeItem, 'outer')
                    : (
                        <div className="bg-gray-100 rounded-lg p-6 text-center">
                          <p className="text-gray-500">
                            {(recommendation.suggestion.outer as any).type || 'Not needed'}
                          </p>
                          {(recommendation.suggestion.outer as any).reason && (
                            <p className="text-sm text-gray-400 mt-1">
                              {(recommendation.suggestion.outer as any).reason}
                            </p>
                          )}
                        </div>
                      )
                ) : (
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Not needed</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating-Based Recommendations */}
          {recommendation.recommendations && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Top Rated Options by Category
              </h2>
              
              {/* Tops */}
              {recommendation.recommendations.tops.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Tops</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendation.recommendations.tops.map((rated, idx) => (
                      <Link
                        key={idx}
                        href={`/item/${rated.item.id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={wardrobeApi.getImageUrl(rated.item.filename)}
                            alt={rated.item.class_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-green-600">
                            {rated.weather_score.toFixed(1)}/10
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 capitalize mb-1">
                            {rated.item.class_name}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{rated.item.thickness || 'N/A'}</span>
                            <span className="text-gray-400">{Math.round(rated.item.confidence * 100)}%</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Shorts */}
              {recommendation.recommendations.shorts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Shorts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendation.recommendations.shorts.map((rated, idx) => (
                      <Link
                        key={idx}
                        href={`/item/${rated.item.id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={wardrobeApi.getImageUrl(rated.item.filename)}
                            alt={rated.item.class_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-green-600">
                            {rated.weather_score.toFixed(1)}/10
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 capitalize mb-1">
                            {rated.item.class_name}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{rated.item.thickness || 'N/A'}</span>
                            <span className="text-gray-400">{Math.round(rated.item.confidence * 100)}%</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottoms */}
              {recommendation.recommendations.bottoms.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Bottoms (Long)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendation.recommendations.bottoms.map((rated, idx) => (
                      <Link
                        key={idx}
                        href={`/item/${rated.item.id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={wardrobeApi.getImageUrl(rated.item.filename)}
                            alt={rated.item.class_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-green-600">
                            {rated.weather_score.toFixed(1)}/10
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 capitalize mb-1">
                            {rated.item.class_name}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{rated.item.thickness || 'N/A'}</span>
                            <span className="text-gray-400">{Math.round(rated.item.confidence * 100)}%</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Outers */}
              {recommendation.recommendations.outers.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Outerwear</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendation.recommendations.outers.map((rated, idx) => (
                      <Link
                        key={idx}
                        href={`/item/${rated.item.id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                      >
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={wardrobeApi.getImageUrl(rated.item.filename)}
                            alt={rated.item.class_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-green-600">
                            {rated.weather_score.toFixed(1)}/10
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 capitalize mb-1">
                            {rated.item.class_name}
                          </h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{rated.item.thickness || 'N/A'}</span>
                            <span className="text-gray-400">{Math.round(rated.item.confidence * 100)}%</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {recommendation.notes && recommendation.notes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Style Tips
              </h3>
              <ul className="space-y-2">
                {recommendation.notes.map((note, index) => (
                  <li key={index} className="text-blue-800 flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

