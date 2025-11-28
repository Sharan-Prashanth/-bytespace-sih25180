import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (self-signup for normal users only)
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    qualification,
    email,
    password,
    phoneNumber,
    designation,
    organisationName,
    organisationType,
    country,
    address,
    expertiseDomains
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user with USER role
  const user = await User.create({
    fullName,
    qualification,
    email: email.toLowerCase(),
    passwordHash: password,
    phoneNumber,
    designation,
    organisationName,
    organisationType,
    country: country || 'India',
    address,
    expertiseDomains: expertiseDomains || [],
    roles: ['USER']
  });

  // Generate token
  const token = generateToken(user._id);

  // Log activity
  await activityLogger.log({
    user: user._id,
    action: 'USER_REGISTERED',
    details: { email: user.email },
    ipAddress: req.ip
  });

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.fullName, 'USER');

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles
      },
      token
    }
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find user and include password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Please contact administrator.'
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Log activity
  await activityLogger.log({
    user: user._id,
    action: 'USER_LOGIN',
    details: { email: user.email },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        designation: user.designation,
        organisationName: user.organisationName
      },
      token
    }
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: user
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'USER_LOGOUT',
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both current and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+passwordHash');

  // Verify current password
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});
