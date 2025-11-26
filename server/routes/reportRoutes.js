import express from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  submitReport,
  deleteReport
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.route('/')
  .get(getReports)
  .post(createReport);

router.route('/:reportId')
  .get(getReportById)
  .put(updateReport)
  .delete(deleteReport);

router.post('/:reportId/submit', submitReport);

export default router;
