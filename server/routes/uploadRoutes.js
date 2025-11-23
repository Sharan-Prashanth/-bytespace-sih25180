import express from 'express';
import { 
  uploadImage, 
  uploadMultipleImages, 
  deleteImage, 
  extractFormContent 
} from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload single image (base64)
router.post('/image', protect, uploadImage);

// Upload multiple images (base64)
router.post('/images', protect, uploadMultipleImages);

// Delete image
router.delete('/image', protect, deleteImage);

// Extract form content from PDF/DOCX
router.post('/extract-form', protect, extractFormContent);

export default router;
