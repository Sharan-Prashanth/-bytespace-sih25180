import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  getUserActivities
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/authorize.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.get('/', isAdmin, getAllUsers);
router.post('/', isAdmin, createUser);
router.delete('/:userId', isAdmin, deleteUser);
router.put('/:userId/roles', isAdmin, updateUserRoles);

// Self or admin routes
router.get('/:userId', getUserById);
router.put('/:userId', updateUser);
router.get('/:userId/activities', getUserActivities);

export default router;
