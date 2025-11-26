import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true
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
      'PRIVATE_SECTOR',
      'PUBLIC_SECTOR_SUBSIDIARY',
      'CMPDI',
      'FOREIGN_ORGANISATION',
      'OTHER'
    ]
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India'
  },
  address: {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  expertiseDomains: [{
    type: String,
    trim: true
  }],
  roles: [{
    type: String,
    enum: [
      'USER',
      'SUPER_ADMIN',
      'CMPDI_MEMBER',
      'TSSRC_MEMBER',
      'SSRC_MEMBER',
      'EXPERT_REVIEWER'
    ],
    default: 'USER'
  }],
  committeeMemberships: [{
    committeeType: {
      type: String,
      enum: ['CMPDI', 'TSSRC', 'SSRC', 'OTHER']
    },
    position: {
      type: String,
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile (without sensitive data)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
