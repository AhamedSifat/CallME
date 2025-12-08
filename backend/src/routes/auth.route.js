import express from 'express';
import {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { multerMiddleware } from '../middlewares/multer.middleware.js';

const router = express.Router();
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', authenticateToken, logout);
router.get('/check-auth', authenticateToken, checkAuthenticated);
router.get('/users', authenticateToken, getAllUsers);

router.post(
  '/update-profile',
  authenticateToken,
  multerMiddleware,
  updateProfile
);
export default router;
