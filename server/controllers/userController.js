import User from '../models/User.js';
import emailService from '../services/emailService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search, page = 1, limit = 50 } = req.query;

  const query = {};

  if (role) {
    query.roles = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { organisationName: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private (Admin or self)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check permission: admin or self
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  const isSelf = req.user._id.toString() === user._id.toString();

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this user'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * @route   POST /api/users
 * @desc    Create a new user (Admin only)
 * @access  Private/Admin
 */
export const createUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    designation,
    organisationName,
    organisationType,
    country,
    address,
    expertiseDomains,
    roles,
    committeeMemberships
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: password || 'ChangeMe@123', // Default password
    phoneNumber,
    designation,
    organisationName,
    organisationType,
    country: country || 'India',
    address,
    expertiseDomains: expertiseDomains || [],
    roles: roles || ['USER'],
    committeeMemberships: committeeMemberships || []
  });

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'USER_CREATED',
    details: { 
      createdUserId: user._id,
      email: user.email,
      roles: user.roles
    },
    ipAddress: req.ip
  });

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.fullName, roles ? roles.join(', ') : 'USER');

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user profile
 * @access  Private (Admin or self)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check permission
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  const isSelf = req.user._id.toString() === user._id.toString();

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this user'
    });
  }

  // Fields that can be updated
  const allowedUpdates = [
    'fullName',
    'phoneNumber',
    'designation',
    'organisationName',
    'organisationType',
    'country',
    'address',
    'expertiseDomains'
  ];

  // Admin-only fields
  const adminOnlyFields = ['roles', 'committeeMemberships', 'isActive'];

  // Update allowed fields
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  // Update admin-only fields if user is admin
  if (isAdmin) {
    adminOnlyFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
  }

  await user.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'USER_UPDATED',
    details: { 
      updatedUserId: user._id,
      updates: Object.keys(req.body)
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent deleting super admin
  if (user.roles.includes('SUPER_ADMIN')) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete super admin user'
    });
  }

  await user.deleteOne();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'USER_DELETED',
    details: { 
      deletedUserId: user._id,
      email: user.email
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * @route   PUT /api/users/:userId/roles
 * @desc    Update user roles (Admin only)
 * @access  Private/Admin
 */
export const updateUserRoles = asyncHandler(async (req, res) => {
  const { roles } = req.body;

  if (!roles || !Array.isArray(roles)) {
    return res.status(400).json({
      success: false,
      message: 'Roles must be provided as an array'
    });
  }

  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const oldRoles = [...user.roles];
  user.roles = roles;
  await user.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'USER_ROLES_UPDATED',
    details: { 
      userId: user._id,
      oldRoles,
      newRoles: roles
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'User roles updated successfully',
    data: user
  });
});

/**
 * @route   GET /api/users/:userId/activities
 * @desc    Get user activities
 * @access  Private (Admin or self)
 */
export const getUserActivities = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  // Check permission
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  const isSelf = req.user._id.toString() === userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view these activities'
    });
  }

  const activities = await activityLogger.getUserActivities(userId, parseInt(limit));

  res.json({
    success: true,
    data: activities
  });
});
