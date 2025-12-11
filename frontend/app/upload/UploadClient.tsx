'use client';

import { useRef, useState, useCallback } from 'react';
import { wardrobeApi, WardrobeItem } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedItem, setUploadedItem] = useState<WardrobeItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadedItem(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setError(null);
      setUploadedItem(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const item = await wardrobeApi.uploadCloth(file);
      setUploadedItem(item);
      setFile(null);
      setPreview(null);
      
      // Redirect to wardrobe after 2 seconds
      setTimeout(() => {
        router.push('/wardrobe');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Upload Your Clothes
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70">
          Add items to your wardrobe and let AI classify them automatically
        </p>
      </div>

      <Card>
        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-md p-8 md:p-12 text-center transition-all duration-smooth ${
            preview
              ? 'border-[#231212] dark:border-white bg-neutral-soft dark:bg-white'
              : 'border-neutral-medium dark:border-white hover:border-[#231212] dark:hover:border-white'
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
                <ImageIcon className="w-8 h-8 text-[#231212] dark:text-white" />
              </div>
              <div>
                <Button
                  variant="secondary"
                  onClick={handleUploadClick}
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Click to upload
                  </span>
                </Button>
                <input
                  ref={fileInputRef}
                  id="file-upload"
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

        {/* Upload Button */}
        {file && !uploadedItem && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload & Classify
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Success Message */}
        {uploadedItem && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 border-2 border-green-500 dark:border-green-400 rounded-md">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-green-800 dark:text-green-200 font-body font-semibold">
                  Upload successful!
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1 font-body">
                  Classified as: <span className="font-medium capitalize">{uploadedItem.class_name}</span> 
                  {' '}({Math.round(uploadedItem.confidence * 100)}% confidence)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 border-2 border-red-500 dark:border-red-400 rounded-md">
            <p className="text-red-800 dark:text-red-200 font-body">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

