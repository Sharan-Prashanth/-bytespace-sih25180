import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  isEmailVerified: {
    type: Boolean,
    default: true // Set to true for now since email verification is not yet implemented
    // TODO: Implement email verification system and set this to false by default
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Contact & Affiliation
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true
  },
  organisationName: {
    type: String,
    required: [true, 'Organisation name is required'],
    trim: true
  },
  organisationType: {
    type: String,
    required: [true, 'Organisation type is required'],
    enum: [
      'INDIAN_ACADEMIC_RESEARCH',
      'INDIAN_GOVT_ORGANISATION',
      'PUBLIC_SECTOR_SUBSIDIARY',
      'FOREIGN_INSTITUTE',
      'CMPDI',
      'OTHER'
    ]
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  address: {
    line1: { type: String, trim: true, default: null },
    line2: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    postalCode: { type: String, trim: true, default: null }
  },

  // Roles & Permissions
  roles: [{
    type: String,
    required: true,
    enum: [
      'USER',
      'CMPDI_MEMBER',
      'EXPERT_REVIEWER',
      'TSSRC_MEMBER',
      'SSRC_MEMBER',
      'SUPER_ADMIN'
    ]
  }],
  committeeMemberships: [{
    committeeType: {
      type: String,
      enum: ['CMPDI', 'TSSRC', 'SSRC', 'OTHER']
    },
    position: {
      type: String,
      trim: true
    }
  }],

  // Domain / Functional Metadata
  expertiseDomains: [{
    type: String,
    trim: true
  }],

  // Audit / Activity
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Collaboration status tracking (for real-time features)
  isOnline: {
    type: Boolean,
    default: false
  },
  currentSocketId: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Get public profile (excludes sensitive data)
userSchema.methods.getPublicProfile = function() {
  const { passwordHash, currentSocketId, ...publicProfile } = this.toObject();
  return publicProfile;
};

// Static method to get users by role(s)
userSchema.statics.getUsersByRole = function(role) {
  if (Array.isArray(role)) {
    return this.find({ roles: { $in: role }, isActive: true });
  }
  return this.find({ roles: role, isActive: true });
};

// Static method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

// Static method to check if user has any of the specified roles
userSchema.methods.hasAnyRole = function(rolesArray) {
  return rolesArray.some(role => this.roles.includes(role));
};

const User = mongoose.model('User', userSchema);
export default User;
