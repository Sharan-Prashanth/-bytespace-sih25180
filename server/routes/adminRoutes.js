import express from "express";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  getAdminStats,
  getAdminProposals,
  adminOverrideStatus
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication and SUPER_ADMIN role
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// Get all users with filtering
router.get("/users", getAdminUsers);

// Create new user
router.post("/users", createAdminUser);

// Update user
router.put("/users/:id", updateAdminUser);

// Toggle user active status
router.patch("/users/:id/toggle-status", toggleUserStatus);

// Delete user
router.delete("/users/:id", deleteAdminUser);

// ============================================
// PROPOSAL MANAGEMENT ROUTES
// ============================================

// Get all proposals
router.get("/proposals", getAdminProposals);

// Admin override proposal status
router.patch("/proposals/:id/override", adminOverrideStatus);

// ============================================
// STATISTICS ROUTES
// ============================================

// Get admin statistics
router.get("/stats", getAdminStats);

export default router;
