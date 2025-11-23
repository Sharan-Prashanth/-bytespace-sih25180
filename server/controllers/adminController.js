import User from '../models/User.js';
import Proposal from '../models/Proposal.js';

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private (SUPER_ADMIN)
export const getAdminUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      role, 
      status, 
      search,
      organization 
    } = req.query;

    // Build query
    const query = {};

    if (role && role !== 'all') {
      query.roles = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (organization && organization !== 'all') {
      query.organisationName = organization;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organisationName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      organization: user.organisationName,
      active: user.isActive,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      users: transformedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// @desc    Create user (admin)
// @route   POST /api/admin/users
// @access  Private (SUPER_ADMIN)
export const createAdminUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      roles,
      designation,
      organisationName,
      organisationType,
      country,
      phoneNumber,
      address,
      expertiseDomains,
      committeeMemberships
    } = req.body;

    // Validation
    if (!fullName || !email || !password || !roles || !designation || 
        !organisationName || !organisationType || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate roles
    const validRoles = ['USER', 'CMPDI_MEMBER', 'EXPERT_REVIEWER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid roles: ${invalidRoles.join(', ')}`
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      passwordHash: password,
      roles,
      designation,
      organisationName,
      organisationType,
      country,
      phoneNumber,
      address,
      expertiseDomains,
      committeeMemberships,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private (SUPER_ADMIN)
export const updateAdminUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      roles,
      designation,
      organisationName,
      organisationType,
      country,
      phoneNumber,
      address,
      expertiseDomains,
      committeeMemberships,
      isActive
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }
    if (roles) user.roles = roles;
    if (designation) user.designation = designation;
    if (organisationName) user.organisationName = organisationName;
    if (organisationType) user.organisationType = organisationType;
    if (country) user.country = country;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (expertiseDomains) user.expertiseDomains = expertiseDomains;
    if (committeeMemberships) user.committeeMemberships = committeeMemberships;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (SUPER_ADMIN)
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating super admins
    if (user.roles.includes('SUPER_ADMIN') && user.isActive) {
      const activeAdmins = await User.countDocuments({
        roles: 'SUPER_ADMIN',
        isActive: true
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active super admin'
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (SUPER_ADMIN)
export const deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admins
    if (user.roles.includes('SUPER_ADMIN')) {
      const activeAdmins = await User.countDocuments({
        roles: 'SUPER_ADMIN',
        isActive: true
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super admin'
        });
      }
    }

    // Check if user has active proposals
    const proposalCount = await Proposal.countDocuments({
      createdBy: user._id,
      isDeleted: false
    });

    if (proposalCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${proposalCount} active proposal(s). Please transfer or delete proposals first.`
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private (SUPER_ADMIN)
export const getAdminStats = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const usersByRole = await User.aggregate([
      {
        $unwind: '$roles'
      },
      {
        $group: {
          _id: '$roles',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = {};
    usersByRole.forEach(item => {
      roleStats[item._id] = item.count;
    });

    // Proposal stats
    const totalProposals = await Proposal.countDocuments({ isDeleted: false });
    const draftProposals = await Proposal.countDocuments({ 
      status: 'draft', 
      isDeleted: false 
    });
    const submittedProposals = await Proposal.countDocuments({
      status: { $ne: 'draft' },
      isDeleted: false
    });

    const proposalsByStatus = await Proposal.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    proposalsByStatus.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: roleStats
        },
        proposals: {
          total: totalProposals,
          draft: draftProposals,
          submitted: submittedProposals,
          byStatus: statusStats
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};

// @desc    Get all proposals for admin
// @route   GET /api/admin/proposals
// @access  Private (SUPER_ADMIN)
export const getAdminProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ isDeleted: false })
      .populate('createdBy', 'fullName email organisationName')
      .sort({ createdAt: -1 });

    // Helper function to get stage owner based on status
    const getStageOwner = (status) => {
      if (status === 'draft') return 'Principal Investigator';
      if (status?.includes('cmpdi')) return 'CMPDI';
      if (status?.includes('expert')) return 'Expert Reviewer';
      if (status?.includes('tssrc')) return 'TSSRC';
      if (status?.includes('ssrc')) return 'SSRC';
      if (status?.includes('project')) return 'Project Team';
      return 'System';
    };

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      principalInvestigator: proposal.createdBy?.fullName,
      organization: proposal.createdBy?.organisationName,
      currentStage: getStageOwner(proposal.status),
      status: proposal.status,
      createdAt: proposal.createdAt
    }));

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get admin proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// @desc    Admin override proposal status
// @route   PATCH /api/admin/proposals/:id/override
// @access  Private (SUPER_ADMIN)
export const adminOverrideStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const oldStatus = proposal.status;
    proposal.status = status;
    
    // Add to status history
    proposal.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: status,
      changedBy: req.user._id,
      changedAt: new Date()
    });

    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal status updated successfully',
      proposal
    });
  } catch (error) {
    console.error('Admin override error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating proposal status'
    });
  }
};
