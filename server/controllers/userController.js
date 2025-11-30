import User from '../models/User.js';
import emailService from '../services/emailService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

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

/**
 * @route   GET /api/users/:userId/proposals/count
 * @desc    Get proposal counts for a user based on their role
 * @access  Private (Admin or self)
 */
export const getUserProposalCount = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check permission
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');
  const isSelf = req.user._id.toString() === userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this data'
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const Proposal = (await import('../models/Proposal.js')).default;

  let counts = {
    total: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    ongoing: 0,
    completed: 0
  };

  // Check user roles and get appropriate counts
  const hasReviewerRole = user.roles.some(role => 
    ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role)
  );

  if (hasReviewerRole) {
    // For reviewers, count proposals assigned to them
    const assignedProposals = await Proposal.find({
      'assignedReviewers.reviewer': userId,
      isDeleted: false
    });

    counts.total = assignedProposals.length;
    counts.underReview = assignedProposals.filter(p => 
      ['CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'TSSRC_REVIEW', 'SSRC_REVIEW'].includes(p.status)
    ).length;
    counts.completed = assignedProposals.filter(p => 
      p.assignedReviewers.some(ar => 
        ar.reviewer.toString() === userId && ar.status === 'COMPLETED'
      )
    ).length;
  } else {
    // For regular users, count their own proposals
    const userProposals = await Proposal.find({
      createdBy: userId,
      isDeleted: false
    });

    counts.total = userProposals.length;
    counts.draft = userProposals.filter(p => p.status === 'DRAFT').length;
    counts.submitted = userProposals.filter(p => p.status === 'SUBMITTED').length;
    counts.underReview = userProposals.filter(p => 
      ['AI_EVALUATION', 'CMPDI_REVIEW', 'CMPDI_EXPERT_REVIEW', 'TSSRC_REVIEW', 'SSRC_REVIEW'].includes(p.status)
    ).length;
    counts.approved = userProposals.filter(p => 
      ['CMPDI_APPROVED', 'TSSRC_APPROVED', 'SSRC_APPROVED', 'ACCEPTED'].includes(p.status)
    ).length;
    counts.rejected = userProposals.filter(p => 
      ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(p.status)
    ).length;
    counts.ongoing = userProposals.filter(p => p.status === 'ONGOING').length;
    counts.completed = userProposals.filter(p => p.status === 'COMPLETED').length;
  }

  res.json({
    success: true,
    data: counts
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Fields that can be updated through profile
  const {
    fullName,
    phone,
    phoneNumber,
    organization,
    organisationName,
    designation,
    address,
    bio,
    preferredTheme
  } = req.body;

  // Update fields if provided
  if (fullName) user.fullName = fullName;
  if (phone || phoneNumber) user.phoneNumber = phone || phoneNumber;
  if (organization || organisationName) user.organisationName = organization || organisationName;
  if (designation) user.designation = designation;
  if (address) user.address = address;
  if (bio) user.bio = bio;
  if (preferredTheme) user.preferredTheme = preferredTheme;

  await user.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PROFILE_UPDATED',
    details: { 
      updatedFields: Object.keys(req.body).filter(k => req.body[k] !== undefined)
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      organization: user.organisationName,
      designation: user.designation,
      address: user.address,
      bio: user.bio,
      roles: user.roles,
      preferredTheme: user.preferredTheme
    }
  });
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Change current user's password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password and save
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.passwordChangedAt = new Date();
  await user.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'PASSWORD_CHANGED',
    details: {},
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});
