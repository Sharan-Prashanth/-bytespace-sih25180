import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured. Image upload will not work.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const SUPABASE_BUCKET = 'proposal-files';

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name of the file
 * @param {string} folder - Folder path (e.g., 'images', 'documents')
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadToSupabase(fileBuffer, fileName, folder = 'images') {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;
  const filePath = `${folder}/${uniqueFileName}`;

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: 'auto',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath
  };
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - Path of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteFromSupabase(filePath) {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
