import express from 'express';
import {
  getComments,
  addComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  markCommentAsRead
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

export default router;
