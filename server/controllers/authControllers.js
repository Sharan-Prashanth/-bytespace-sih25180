import User from "../models/User.js";
import Proposal from "../models/Proposal.js";
import { generateToken } from "../utils/generateToken.js";
import emailService from "../services/emailService.js";

// Register user (PUBLIC - Only USER role)
export const registerUser = async (req, res) => {
    try {
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
            expertiseDomains
        } = req.body;

        // Validation
        if (!fullName || !email || !password || !designation || !organisationName || !organisationType || !country) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: fullName, email, password, designation, organisationName, organisationType, country'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user with USER role only (public registration)
        const user = await User.create({
            fullName,
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            roles: ['USER'], // Only USER role for public registration
            phoneNumber,
            designation,
            organisationName,
            organisationType,
            country,
            address: address || {},
            expertiseDomains: expertiseDomains || []
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Send welcome email (don't block registration if email fails)
        try {
            await emailService.sendWelcomeEmail(user.email, user.fullName, user.roles[0]);
            console.log(`✅ Welcome email sent to ${user.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send welcome email:', emailError.message);
            // Continue with registration success even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({
                success: false,
                message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check user exists and get password
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login timestamp
        user.lastLoginAt = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            phoneNumber,
            designation,
            organisationName,
            organisationType,
            country,
            address,
            expertiseDomains
        } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (designation) updateData.designation = designation;
        if (organisationName) updateData.organisationName = organisationName;
        if (organisationType) updateData.organisationType = organisationType;
        if (country) updateData.country = country;
        if (address) updateData.address = address;

        // Handle expertise domains array
        if (expertiseDomains) {
            if (Array.isArray(expertiseDomains)) {
                updateData.expertiseDomains = expertiseDomains.filter(e => e.trim());
            } else if (typeof expertiseDomains === 'string') {
                updateData.expertiseDomains = expertiseDomains.split(',').map(e => e.trim()).filter(e => e);
            }
        }

        // Check if email is being changed and if it already exists
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another account'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Update profile error:', error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({
                success: false,
                message
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating profile'
        });
    }
};

// Create user with elevated roles (SUPER_ADMIN only)
export const createUserWithRole = async (req, res) => {
    try {
        const { 
            fullName, 
            email, 
            password, 
            roles,
            phoneNumber,
            designation,
            organisationName,
            organisationType,
            country,
            address,
            expertiseDomains,
            committeeMemberships
        } = req.body;

        // Validation
        if (!fullName || !email || !password || !roles || !designation || !organisationName || !organisationType || !country) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate roles array
        const validRoles = ['USER', 'CMPDI_MEMBER', 'EXPERT_REVIEWER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'];
        const invalidRoles = roles.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid role(s): ${invalidRoles.join(', ')}`
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user with specified roles
        const user = await User.create({
            fullName,
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            roles,
            phoneNumber,
            designation,
            organisationName,
            organisationType,
            country,
            address: address || {},
            expertiseDomains: expertiseDomains || [],
            committeeMemberships: committeeMemberships || [],
            createdBy: req.user._id // Track who created this user
        });

        // Send welcome email (don't block user creation if email fails)
        try {
            await emailService.sendWelcomeEmail(user.email, user.fullName, user.roles.join(', '));
            console.log(`✅ Welcome email sent to ${user.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send welcome email:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Create user error:', error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({
                success: false,
                message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating user'
        });
    }
};

// Get users by role (SUPER_ADMIN only)
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const validRoles = ['USER', 'CMPDI_MEMBER', 'EXPERT_REVIEWER', 'TSSRC_MEMBER', 'SSRC_MEMBER', 'SUPER_ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const users = await User.getUsersByRole(role);

        res.json({
            success: true,
            count: users.length,
            users: users.map(user => user.getPublicProfile())
        });

    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

// Get all users (SUPER_ADMIN only)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, role, search } = req.query;

        const query = {};
        
        // Filter by role if provided
        if (role) {
            query.roles = role;
        }

        // Search by name or email if provided
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            users: users.map(user => user.getPublicProfile()),
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalUsers: count
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

// Update user roles and status (SUPER_ADMIN only)
export const updateUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roles, isActive, committeeMemberships } = req.body;

        const updateData = {};
        if (roles) updateData.roles = roles;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (committeeMemberships) updateData.committeeMemberships = committeeMemberships;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Update user roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating user'
        });
    }
};

// Delete user (SUPER_ADMIN only)
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting yourself
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting user'
        });
    }
};

// Get system statistics (SUPER_ADMIN only)
export const getSystemStats = async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        
        // Count users by role
        const usersByRole = await User.aggregate([
            { $unwind: '$roles' },
            { $group: { _id: '$roles', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get proposal statistics (if Proposal model exists)
        let proposalStats = null;
        try {
            const totalProposals = await Proposal.countDocuments();
            const proposalsByStatus = await Proposal.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);
            
            proposalStats = {
                total: totalProposals,
                byStatus: proposalsByStatus
            };
        } catch (error) {
            console.log('Proposal stats not available:', error.message);
        }

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = await User.countDocuments({ 
            createdAt: { $gte: thirtyDaysAgo } 
        });

        // Get committee member counts
        const committeeStats = await User.aggregate([
            { $match: { 'committeeMemberships.0': { $exists: true } } },
            { $unwind: '$committeeMemberships' },
            { $group: { _id: '$committeeMemberships.committeeType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    recentRegistrations,
                    byRole: usersByRole,
                    committeeMembers: committeeStats
                },
                proposals: proposalStats,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching system statistics'
        });
    }
};
