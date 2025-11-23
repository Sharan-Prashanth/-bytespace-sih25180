import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukykrsrwamxhfbcfdncm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload image to Supabase Storage
 * @param {File|Blob|string} file - File object, Blob, or base64 string
 * @param {string} folder - Folder path in the bucket (e.g., 'signatures', 'seals', 'editor-images')
 * @param {string} fileName - Optional custom filename
 * @returns {Promise<{url: string, path: string, error: null}|{url: null, path: null, error: string}>}
 */
export async function uploadImage(file, folder = 'uploads', fileName = null) {
  try {
    console.log("url", supabaseUrl, "key", supabaseKey, "supabase", supabase);
    let fileToUpload = file;
    let finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Handle base64 string conversion
    if (typeof file === 'string' && file.startsWith('data:')) {
      const base64Data = file.split(',')[1];
      const mimeType = file.split(';')[0].split(':')[1];
      const extension = mimeType.split('/')[1];
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileToUpload = new Blob([byteArray], { type: mimeType });
      
      if (!fileName) {
        finalFileName = `${finalFileName}.${extension}`;
      }
    } else if (file instanceof File) {
      if (!fileName) {
        finalFileName = `${Date.now()}_${file.name}`;
      }
    }

    // Upload to Supabase Storage
    const filePath = `${folder}/${finalFileName}`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { url: null, path: null, error: error.message };
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
      error: null
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { url: null, path: null, error: err.message };
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} filePath - Path of the file in the bucket
 * @returns {Promise<{success: boolean, error: null|string}>}
 */
export async function deleteImage(filePath) {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Delete error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * List files in a folder
 * @param {string} folder - Folder path in the bucket
 * @returns {Promise<{files: Array, error: null|string}>}
 */
export async function listImages(folder = '') {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Supabase list error:', error);
      return { files: [], error: error.message };
    }

    return { files: data, error: null };
  } catch (err) {
    console.error('List error:', err);
    return { files: [], error: err.message };
  }
}

/**
 * Get public URL for a file
 * @param {string} filePath - Path of the file in the bucket
 * @returns {string} Public URL
 */
export function getPublicUrl(filePath) {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default supabase;
