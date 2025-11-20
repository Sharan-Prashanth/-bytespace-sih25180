import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import emailService from "../services/emailService.js";

// Register user
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role = 'user', department, expertise } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
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

        // Validate role
        const validRoles = ['user', 'reviewer', 'staff'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            department,
            expertise: expertise ? expertise.split(',').map(e => e.trim()) : []
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Send welcome email (don't block registration if email fails)
        try {
            await emailService.sendWelcomeEmail(user.email, user.name, user.role);
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
        const user = await User.findOne({ email }).select('+password');
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
                message: 'Account is deactivated'
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
        const { name, email, department, expertise, profilePicture } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (department) updateData.department = department;
        if (profilePicture) updateData.profilePicture = profilePicture;

        // Handle expertise array
        if (expertise) {
            if (Array.isArray(expertise)) {
                updateData.expertise = expertise.filter(e => e.trim());
            } else if (typeof expertise === 'string') {
                updateData.expertise = expertise.split(',').map(e => e.trim()).filter(e => e);
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

// Get staff members for assignment (reviewers only)
export const getStaffMembers = async (req, res) => {
    try {
        const staffMembers = await User.getUsersByRole('staff');

        res.json({
            success: true,
            staff: staffMembers.map(staff => ({
                id: staff._id,
                name: staff.name,
                email: staff.email,
                expertise: staff.expertise,
                department: staff.department
            }))
        });

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching staff members'
        });
    }
};
