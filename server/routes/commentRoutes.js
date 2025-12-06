import express from 'express';
import {
  getComments,
  addComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  markCommentAsRead,
  getInlineComments,
  createInlineComment,
  replyToInlineComment,
  resolveInlineComment
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.route('/')
  .get(getComments)
  .post(addComment);

router.post('/:commentId/reply', replyToComment);
router.put('/:commentId/resolve', resolveComment);
router.put('/:commentId/unresolve', unresolveComment);
router.put('/:commentId/read', markCommentAsRead);

// Inline comments routes (for editor discussions)
router.get('/inline', getInlineComments);
router.post('/inline', createInlineComment);
router.post('/inline/:discussionId/reply', replyToInlineComment);
router.put('/inline/:discussionId/resolve', resolveInlineComment);

export default router;
