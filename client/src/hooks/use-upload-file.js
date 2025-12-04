import * as React from 'react';

import { toast } from 'sonner';
import { z } from 'zod';
import { uploadImage as uploadImageApi } from '../utils/proposalApi';

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  folder = 'editor-images',
  ...props
} = {}) {
  const [uploadedFile, setUploadedFile] = React.useState();
  const [uploadingFile, setUploadingFile] = React.useState();
  const [progress, setProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadFile(file) {
    setIsUploading(true);
    setUploadingFile(file);
    setProgress(0);

    console.log('[useUploadFile] Starting upload for file:', file.name, file.type, file.size);

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to backend API which stores in Supabase S3
      console.log('[useUploadFile] Calling uploadImageApi with folder:', folder);
      const response = await uploadImageApi(file, folder);

      clearInterval(progressInterval);
      setProgress(100);

      console.log('[useUploadFile] Full API response:', JSON.stringify(response, null, 2));

      // response is already response.data from proposalApi, which contains { success, data: { url, path, s3Key } }
      const uploadData = response.data || response;
      
      console.log('[useUploadFile] Upload data extracted:', JSON.stringify(uploadData, null, 2));

      if (!uploadData || !uploadData.url) {
        console.error('[useUploadFile] Invalid upload response - missing URL');
        throw new Error('Upload response missing URL');
      }

      const uploadedFileData = {
        key: uploadData.s3Key || uploadData.path,
        appUrl: uploadData.url,
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadData.url,
        s3Key: uploadData.s3Key || uploadData.path // Store for deletion
      };
      
      console.log('[useUploadFile] Final uploaded file data:', JSON.stringify(uploadedFileData, null, 2));

      setUploadedFile(uploadedFileData);
      onUploadComplete?.(uploadedFileData);

      return uploadedFileData;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : 'Something went wrong, please try again later.';

      toast.error(message);
      onUploadError?.(error);

      // Return null on error instead of mocking
      return null;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile,
    uploadingFile,
  };
}

export function getErrorMessage(err) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join('\n');
  } else if (err instanceof Error) {
    return err.message;
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    return err.message;
  } else {
    return unknownError;
  }
}

export function showErrorToast(err) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
