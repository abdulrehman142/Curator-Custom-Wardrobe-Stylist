'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Upload, X, Check, Image as ImageIcon, ExternalLink, Copy } from 'lucide-react';

interface S3UploadResponse {
  key: string;
  url: string;
}

export default function TestS3UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<S3UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
      
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
      setUploadResult(null);
      
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
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call the test-upload-s3 endpoint on the backend
      const response = await fetch('http://localhost:8000/test-upload-s3', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: S3UploadResponse = await response.json();
      setUploadResult(data);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-8 py-12 md:py-24">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display mb-4 text-[#231212] dark:text-white">
          Test S3 Direct Upload
        </h1>
        <p className="text-base md:text-lg font-body text-black dark:text-white opacity-70">
          Test the /test-upload-s3 backend endpoint directly
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

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-md">
            <p className="text-red-800 dark:text-red-100 text-sm font-body">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        )}

        {/* Upload Button */}
        {file && !uploadResult && (
          <div className="mt-8 flex gap-3 justify-center">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              variant={uploading ? 'secondary' : 'primary'}
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload to S3'}
              </span>
            </Button>
          </div>
        )}

        {/* Success Result */}
        {uploadResult && (
          <div className="mt-8 p-6 bg-green-100 dark:bg-green-900 rounded-md border border-green-400 dark:border-green-700">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-5 h-5 text-green-700 dark:text-green-200" />
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Upload Successful!
              </h3>
            </div>

            <div className="space-y-4">
              {/* S3 Key */}
              <div className="bg-white dark:bg-neutral-800 p-4 rounded-md">
                <label className="text-xs uppercase font-semibold text-green-800 dark:text-green-200 opacity-70">
                  S3 Key
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-sm font-mono text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 p-2 rounded flex-1 break-all">
                    {uploadResult.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(uploadResult.key)}
                    className="p-2 hover:bg-neutral-200 dark:bg-black dark:hover:bg-gray-900 dark:text-white rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-black dark:text-white" />
                  </button>
                </div>
              </div>

              {/* S3 URL */}
              <div className="bg-white dark:bg-neutral-800 p-4 rounded-md">
                <label className="text-xs uppercase font-semibold text-green-800 dark:text-green-200 opacity-70">
                  S3 URL
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-900 p-2 rounded flex-1 break-all">
                    {uploadResult.url}
                  </code>
                  <a
                    href={uploadResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-neutral-200 dark:bg-black dark:hover:bg-gray-900 dark:text-white rounded transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4 text-black dark:text-white" />
                  </a>
                    <button
                      onClick={() => copyToClipboard(uploadResult.url)}
                      className="p-2 hover:bg-neutral-200 dark:bg-black dark:hover:bg-gray-900 dark:text-white rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 text-black dark:text-white" />
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white dark:bg-neutral-800 p-4 rounded-md text-sm">
                <p className="text-black dark:text-white mb-2">
                  <span className="font-semibold">Endpoint used:</span> POST /test-upload-s3
                </p>
                <p className="text-black dark:text-white opacity-70">
                  File uploaded directly to AWS S3 bucket. You can now access it via the URL above (if bucket permissions allow).
                </p>
              </div>
            </div>

            {/* Upload Another Button */}
            <div className="mt-6 flex gap-3 justify-center">
              <Button onClick={() => setUploadResult(null)} variant="secondary">
                Upload Another
              </Button>
              <Button onClick={() => router.push('/')} variant="primary">
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
