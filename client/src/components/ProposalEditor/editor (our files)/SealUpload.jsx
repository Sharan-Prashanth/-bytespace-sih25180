'use client';

import { useState, useEffect } from 'react';

/**
 * SealUpload Component
 * Allows users to upload institution seal/stamp image
 */
const SealUpload = ({ 
  onUpload, 
  label = 'Institution Seal',
  value = null,
  required = false,
  recommendedDimensions = { width: 200, height: 200 }
}) => {
  const [sealData, setSealData] = useState(value);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value);

  useEffect(() => {
    if (value) {
      setSealData(value);
      setPreview(value);
    }
  }, [value]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    // Read file and convert to base64 (will upload to S3 on proposal submission)
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      
      // Validate dimensions (optional warning)
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        if (width !== recommendedDimensions.width || height !== recommendedDimensions.height) {
          setError(
            `Recommended dimensions: ${recommendedDimensions.width}x${recommendedDimensions.height}px. ` +
            `Your image: ${width}x${height}px. Consider resizing for best results.`
          );
        } else {
          setError('');
        }
      };
      img.src = dataUrl;

      // Save as base64 (will upload to S3 on proposal submission)
      setSealData(dataUrl);
      setPreview(dataUrl);
      setUploadedFile(file);
      onUpload(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setSealData(null);
    setPreview(null);
    setUploadedFile(null);
    setError('');
    onUpload(null);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <label className="block text-sm font-semibold text-black mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <p className="text-xs text-black mb-3">
        Upload institution seal/stamp (recommended: {recommendedDimensions.width}x{recommendedDimensions.height}px)
      </p>

      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id={`seal-upload-${label}`}
          />
          <label
            htmlFor={`seal-upload-${label}`}
            className="cursor-pointer"
          >
            <div className="mb-3">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-black mb-1">
              Click to upload seal image
            </p>
            <p className="text-xs text-black">
              PNG, JPG up to 2MB
            </p>
            <p className="text-xs text-black mt-2">
              Preferably transparent background
            </p>
          </label>
        </div>
      ) : (
        <div>
          {/* Preview */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white mb-3">
            <p className="text-xs font-semibold text-black mb-2">Preview:</p>
            <div className="flex items-center justify-center bg-gray-50 p-4 rounded">
              <img 
                src={preview} 
                alt={label}
                className="max-w-full h-auto"
                style={{ maxHeight: '200px' }}
              />
            </div>
          </div>

          {/* File Info */}
          {uploadedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">File:</span> {uploadedFile.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <span className="font-semibold">Size:</span> {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <label
              htmlFor={`seal-upload-${label}`}
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Replace
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id={`seal-upload-${label}`}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Error/Warning Message */}
      {error && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SealUpload;
