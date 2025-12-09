import express from 'express';
import {
  sendMessage,
  getConversation,
  getMessagesByConversationId,
  markMessagesAsRead,
  deleteMessage,
} from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { multerMiddleware } from '../middleware/multer.middleware.js';

const router = express.Router();
router.post('/send-message', authenticateToken, multerMiddleware, sendMessage);

router.get('/conversations', authenticateToken, getConversation);

router.get(
  '/conversations/:conversationId/messages',
  authenticateToken,
  getMessagesByConversationId
);
router.put('/messages/read', authenticateToken, markMessagesAsRead);

router.delete('/messages/:messageId', authenticateToken, deleteMessage);

export default router;
