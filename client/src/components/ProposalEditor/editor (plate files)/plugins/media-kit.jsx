'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '@/components/ui (plate files)/media-audio-node';
import { MediaEmbedElement } from '@/components/ui (plate files)/media-embed-node';
import { FileElement } from '@/components/ui (plate files)/media-file-node';
import { ImageElement } from '@/components/ui (plate files)/media-image-node';
import { PlaceholderElement } from '@/components/ui (plate files)/media-placeholder-node';
import { MediaPreviewDialog } from '@/components/ui (plate files)/media-preview-dialog';
import { MediaUploadToast } from '@/components/ui (plate files)/media-upload-toast';
import { VideoElement } from '@/components/ui (plate files)/media-video-node';
import { uploadImage as uploadImageApi } from '@/utils/proposalApi';

// Custom upload function that uploads to S3 via backend API
const uploadImageToS3 = async (dataUrl) => {
  try {
    console.log('[MediaKit] uploadImageToS3 called');
    
    // Convert data URL to File object
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, { 
      type: blob.type 
    });
    
    console.log('[MediaKit] Uploading file to S3:', file.name, file.type, file.size);
    
    // Upload to S3 via backend API
    const uploadResponse = await uploadImageApi(file, 'editor-images');
    console.log('[MediaKit] Upload response:', uploadResponse);
    
    const uploadData = uploadResponse.data || uploadResponse;
    
    if (!uploadData || !uploadData.url) {
      console.error('[MediaKit] Upload failed - no URL returned');
      return dataUrl; // Fallback to data URL if upload fails
    }
    
    console.log('[MediaKit] Image uploaded successfully:', uploadData.url);
    return uploadData.url;
  } catch (error) {
    console.error('[MediaKit] S3 upload error:', error);
    return dataUrl; // Fallback to data URL if upload fails
  }
};

export const MediaKit = [
  ImagePlugin.configure({
    options: { 
      disableUploadInsert: true, // Use our custom file picker instead
      maxWidth: 800, // Restrict image width
      uploadImage: uploadImageToS3, // Custom upload function for pasted/dropped images
    },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
