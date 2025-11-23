import { uploadToSupabase, deleteFromSupabase } from '../utils/supabaseClient.js';

/**
 * Upload image (base64 or file) to Supabase
 * @route   POST /api/upload/image
 * @access  Private
 */
export const uploadImage = async (req, res) => {
  try {
    const { image, folder = 'images', fileName } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    let fileBuffer;
    let finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Handle base64 string
    if (typeof image === 'string' && image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const extension = mimeType.split('/')[1];
      
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      if (!fileName) {
        finalFileName = `${finalFileName}.${extension}`;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected base64 data URL'
      });
    }

    // Upload to Supabase
    const result = await uploadToSupabase(fileBuffer, finalFileName, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
};

/**
 * Upload multiple images at once
 * @route   POST /api/upload/images
 * @access  Private
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    const { images, folder = 'images' } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const uploadPromises = images.map(async (imageData, index) => {
      try {
        const { image, fileName } = imageData;
        
        if (!image) {
          throw new Error(`Image at index ${index} has no data`);
        }

        let fileBuffer;
        let finalFileName = fileName || `${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`;

        // Handle base64 string
        if (typeof image === 'string' && image.startsWith('data:')) {
          const base64Data = image.split(',')[1];
          const mimeType = image.split(';')[0].split(':')[1];
          const extension = mimeType.split('/')[1];
          
          fileBuffer = Buffer.from(base64Data, 'base64');
          
          if (!fileName) {
            finalFileName = `${finalFileName}.${extension}`;
          }
        } else {
          throw new Error(`Invalid image format at index ${index}`);
        }

        // Upload to Supabase
        const result = await uploadToSupabase(fileBuffer, finalFileName, folder);
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      message: `Uploaded ${successful.length} of ${images.length} images`,
      data: {
        successful,
        failed,
        total: images.length,
        successCount: successful.length,
        failedCount: failed.length
      }
    });
  } catch (error) {
    console.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};

/**
 * Delete image from Supabase
 * @route   DELETE /api/upload/image
 * @access  Private
 */
export const deleteImage = async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'No file path provided'
      });
    }

    await deleteFromSupabase(path);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
};

/**
 * Extract content from PDF/DOCX file
 * @route   POST /api/upload/extract-form
 * @access  Private
 */
export const extractFormContent = async (req, res) => {
  try {
    const { file, formId, fileName } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file data provided'
      });
    }

    // TODO: Implement actual PDF/DOCX parsing using pdf-parse or mammoth
    // For now, return mock content with proper structure
    const mockContent = [
      {
        type: 'h1',
        children: [{ text: `Content Extracted from ${fileName || 'Document'}` }]
      },
      {
        type: 'p',
        children: [{ 
          text: `This is extracted content from the uploaded file. Form ID: ${formId || 'Unknown'}` 
        }]
      },
      {
        type: 'p',
        children: [{ 
          text: 'In production, this would contain the actual parsed text from the PDF/DOCX file. The content would be properly structured with headings, paragraphs, tables, and other elements.' 
        }]
      },
      {
        type: 'h2',
        children: [{ text: 'Instructions' }]
      },
      {
        type: 'p',
        children: [{ 
          text: 'You can now edit this content in the editor. Make any necessary corrections or additions before submitting your proposal.' 
        }]
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Form content extracted successfully',
      data: {
        content: mockContent,
        fileName: fileName || 'document',
        formId: formId || null
      }
    });
  } catch (error) {
    console.error('Form extraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract form content'
    });
  }
};
