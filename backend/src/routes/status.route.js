import express from 'express';
import {
  createStatus,
  getStatuses,
  viewStatus,
  deleteStatus,
} from '../controllers/status.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { multerMiddleware } from '../middleware/multer.middleware.js';

const router = express.Router();
router.post(
  '/create-status',
  authenticateToken,
  multerMiddleware,
  createStatus
);
router.get('/get-statuses', authenticateToken, getStatuses);
router.put('/view-status/:statusId', authenticateToken, viewStatus);
router.delete('/delete-status/:statusId', authenticateToken, deleteStatus);

export default router;
