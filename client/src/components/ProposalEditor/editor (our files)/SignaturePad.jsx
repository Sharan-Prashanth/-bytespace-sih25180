'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

/**
 * SignaturePad Component
 * Allows users to either draw their signature or upload an image
 */
const SignaturePad = ({ 
  onSave, 
  onRemove = () => {},
  label = 'Signature',
  value = null,
  width = 400,
  height = 200,
  required = false
}) => {
  const sigCanvas = useRef(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'upload'
  const [signatureData, setSignatureData] = useState(value);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (value) {
      setSignatureData(value);
    }
  }, [value]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setSignatureData(null);
    setUploadedFile(null);
    setError('');
    onSave(null);
    onRemove();
  };

  const handleSaveDrawing = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      setSignatureData(dataUrl);
      onSave(dataUrl); // Save as base64, will upload to S3 on proposal submission
      setError('');
    } else {
      setError('Please draw your signature before saving');
    }
  };

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
      setSignatureData(dataUrl);
      setUploadedFile(file);
      onSave(dataUrl);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <label className="block text-sm font-semibold text-black mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setSignatureMode('draw');
            setError('');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            signatureMode === 'draw'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Draw Signature
        </button>
        <button
          type="button"
          onClick={() => {
            setSignatureMode('upload');
            setError('');
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            signatureMode === 'upload'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Image
        </button>
      </div>

      {/* Drawing Mode */}
      {signatureMode === 'draw' && (
        <div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white mb-3">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                width: width,
                height: height,
                className: 'signature-canvas',
                style: { width: '100%', height: 'auto', touchAction: 'none' }
              }}
              backgroundColor="white"
              penColor="black"
              dotSize={1}
              minWidth={0.5}
              maxWidth={2.5}
              velocityFilterWeight={0.7}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDrawing}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Signature
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {signatureMode === 'upload' && (
        <div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id={`signature-upload-${label}`}
            />
            <label
              htmlFor={`signature-upload-${label}`}
              className="cursor-pointer"
            >
              <div className="mb-2">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-black mb-1">
                Click to upload signature image
              </p>
              <p className="text-xs text-black">
                PNG, JPG up to 2MB
              </p>
              <p className="text-xs text-black mt-1">
                Recommended: Sign on white paper, scan/photo and upload
              </p>
            </label>
          </div>
          {uploadedFile && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Uploaded: {uploadedFile.name}</span>
            </div>
          )}
          {signatureData && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Preview */}
      {signatureData && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-black mb-2">Preview:</p>
          <div className="border border-gray-300 rounded-lg p-2 bg-white inline-block">
            <img 
              src={signatureData} 
              alt={label}
              className="max-w-full h-auto"
              style={{ maxHeight: '150px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
