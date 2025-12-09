import express from 'express';
import {
  getClarificationReportById,
  updateClarificationReport,
  uploadSealImage,
  removeSealImage,
  uploadEmbeddedImage,
  removeEmbeddedImage,
  submitClarificationReport,
  exportReportPDF,
  exportReportDOCX,
  deleteClarificationReport,
  uploadScannedDocument
} from '../controllers/clarificationReportController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Single report routes
router.get('/:reportId', getClarificationReportById);
router.put('/:reportId', updateClarificationReport);
router.delete('/:reportId', deleteClarificationReport);

// Seal/stamp upload routes
router.post('/:reportId/upload-seal', upload.single('seal'), uploadSealImage);
router.delete('/:reportId/seal', removeSealImage);

// Embedded image routes
router.post('/:reportId/upload-image', upload.single('image'), uploadEmbeddedImage);
router.delete('/:reportId/images/:imageKey', removeEmbeddedImage);

// Submit report
router.post('/:reportId/submit', submitClarificationReport);

// Upload scanned signed document
router.post('/:reportId/upload-scanned', upload.single('file'), uploadScannedDocument);

// Export routes
router.get('/:reportId/export-pdf', exportReportPDF);
router.get('/:reportId/export-docx', exportReportDOCX);

export default router;
