import storageService from '../services/storageService.js';

/**
 * Upload file buffer to Supabase storage
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Destination file path (e.g., 'clarifications/seals/123.png')
 * @param {string} mimetype - File MIME type
 * @param {string} bucket - Storage bucket ('images' or 'proposalFiles')
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export async function uploadToS3(buffer, fileName, mimetype, bucket = 'images') {
  try {
    const file = {
      buffer,
      mimetype,
      originalname: fileName,
      size: buffer.length
    };

    let result;
    if (bucket === 'images' || !bucket) {
      // For images (seals, signatures, embedded images)
      const folder = fileName.split('/')[0] || 'clarifications';
      result = await storageService.uploadImage(file, folder);
    } else {
      // For proposal files (PDFs, documents)
      result = await storageService.uploadProposalFile(file, 'clarifications', 'documents');
    }

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
      key: result.path // For backwards compatibility
    };
  } catch (error) {
    console.error('[s3Helper.uploadToS3] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete file from Supabase storage
 * @param {string} key - File path/key in storage
 * @param {string} bucket - Storage bucket ('images' or 'proposalFiles')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromS3(key, bucket = 'images') {
  try {
    const bucketName = bucket === 'images' ? 'images' : 'proposal-files';
    const result = await storageService.deleteFile(bucketName, key);

    if (!result.success) {
      throw new Error(result.error || 'Delete failed');
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('[s3Helper.deleteFromS3] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get public URL for a file
 * @param {string} key - File path/key in storage
 * @param {string} bucket - Storage bucket ('images' or 'proposalFiles')
 * @returns {string} Public URL
 */
export function getS3Url(key, bucket = 'images') {
  const bucketName = bucket === 'images' ? 'images' : 'proposal-files';
  return storageService.getPublicUrl(bucketName, key);
}
