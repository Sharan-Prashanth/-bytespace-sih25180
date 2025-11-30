import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  getUserActivities,
  getUserProposalCount,
  updateProfile,
  changePassword
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Current user routes (must be before /:userId routes)
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Admin-only routes
router.get('/', isAdmin, getAllUsers);
router.post('/', isAdmin, createUser);
router.delete('/:userId', isAdmin, deleteUser);
router.put('/:userId/roles', isAdmin, updateUserRoles);

// Self or admin routes
router.get('/:userId', getUserById);
router.put('/:userId', updateUser);
router.get('/:userId/activities', getUserActivities);
router.get('/:userId/proposals/count', getUserProposalCount);

export default router;
