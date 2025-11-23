import express from "express";
import { 
  loginUser, 
  registerUser, 
  getProfile, 
  updateProfile,
  createUserWithRole,
  getUsersByRole,
  getAllUsers,
  updateUserRoles,
  deleteUser,
  getSystemStats
} from "../controllers/authControllers.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Login
router.post("/login", loginUser);

// Register (USER role only - public registration)
router.post("/register", registerUser);

// Handle GET requests to registration endpoint with helpful error
router.get("/register", (req, res) => {
  res.status(405).json({
    success: false,
    message: "GET method not allowed. Use POST method to register a user.",
    allowedMethods: ["POST"],
    usage: {
      method: "POST",
      endpoint: "/api/auth/register",
      body: {
        fullName: "string (required)",
        email: "string (required)",
        password: "string (required)",
        designation: "string (required)",
        organisationName: "string (required)",
        organisationType: "string (required) - INDIAN_ACADEMIC_RESEARCH | INDIAN_GOVT_ORGANISATION | PUBLIC_SECTOR_SUBSIDIARY | FOREIGN_INSTITUTE | CMPDI | OTHER",
        country: "string (required)",
        phoneNumber: "string (optional)",
        address: "object (optional) - {line1, line2, city, state, postalCode}",
        expertiseDomains: "array of strings (optional)"
      }
    }
  });
});

// Similar handler for login endpoint
router.get("/login", (req, res) => {
  res.status(405).json({
    success: false,
    message: "GET method not allowed. Use POST method to login.",
    allowedMethods: ["POST"],
    usage: {
      method: "POST",
      endpoint: "/api/auth/login",
      body: {
        email: "string (required)",
        password: "string (required)"
      }
    }
  });
});

// ============================================
// PROTECTED ROUTES (All authenticated users)
// ============================================

// Get current user profile
router.get("/me", protect, getProfile);

// Update own profile
router.put("/profile", protect, updateProfile);

// ============================================
// SUPER ADMIN ONLY ROUTES
// ============================================

// Get system statistics
router.get("/admin/stats", protect, authorize('SUPER_ADMIN'), getSystemStats);

// Create user with specific roles (CMPDI_MEMBER, EXPERT_REVIEWER, TSSRC_MEMBER, SSRC_MEMBER, SUPER_ADMIN)
router.post("/admin/users", protect, authorize('SUPER_ADMIN'), createUserWithRole);

// Get all users with pagination and filters
router.get("/admin/users", protect, authorize('SUPER_ADMIN'), getAllUsers);

// Get users by specific role
router.get("/admin/users/role/:role", protect, authorize('SUPER_ADMIN'), getUsersByRole);

// Update user roles and status
router.put("/admin/users/:userId", protect, authorize('SUPER_ADMIN'), updateUserRoles);

// Delete user
router.delete("/admin/users/:userId", protect, authorize('SUPER_ADMIN'), deleteUser);

export default router;
