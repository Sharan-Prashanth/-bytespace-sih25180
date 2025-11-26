import express from 'express';
import {
  getChatMessages,
  sendChatMessage,
  markMessageAsRead,
  markAllMessagesAsRead
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.route('/')
  .get(getChatMessages)
  .post(sendChatMessage);

router.post('/mark-all-read', markAllMessagesAsRead);
router.put('/:messageId/read', markMessageAsRead);

export default router;
