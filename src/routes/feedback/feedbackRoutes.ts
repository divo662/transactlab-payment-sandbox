import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth/authMiddleware';
import { adminOnly } from '../../middleware/auth/roleMiddleware';
import {
  createFeedback,
  getUserFeedback,
  getPublicFeedback,
  getFeedbackById,
  updateFeedback,
  voteFeedback,
  getAllFeedback,
  adminUpdateFeedback,
  getFeedbackStats
} from '../../controllers/feedback/feedbackController';

const router = Router();

// Public routes
router.get('/public', getPublicFeedback);
router.get('/stats', getFeedbackStats);

// User routes (require authentication)
router.post('/', authenticateToken, createFeedback);
router.get('/my', authenticateToken, getUserFeedback);
router.get('/:id', authenticateToken, getFeedbackById);
router.put('/:id', authenticateToken, updateFeedback);
router.post('/:id/vote', authenticateToken, voteFeedback);

// Admin routes (require admin role)
router.get('/admin/all', authenticateToken, adminOnly, getAllFeedback);
router.put('/admin/:id', authenticateToken, adminOnly, adminUpdateFeedback);

export default router;
