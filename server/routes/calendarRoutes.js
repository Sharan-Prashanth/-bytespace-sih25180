import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotes,
  getNotesByDate,
  addNote,
  updateNote,
  deleteNote
} from '../controllers/calendarController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.route('/notes')
  .get(getNotes)
  .post(addNote);

router.route('/notes/:date')
  .get(getNotesByDate);

router.route('/notes/:id')
  .put(updateNote)
  .delete(deleteNote);

export default router;
