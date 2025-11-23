import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Mock data for different roles
const mockUsers = [
  {
    fullName: 'Admin User',
    email: 'bytespacesih@gmail.com',
    passwordHash: 'adminpass',
    roles: ['SUPER_ADMIN'],
    designation: 'System Administrator',
    organisationName: 'NaCCER Administration',
    organisationType: 'INDIAN_GOVT_ORGANISATION',
    country: 'India',
    phoneNumber: '+91-9876543210',
    address: {
      line1: 'NaCCER Head Office',
      line2: 'Administrative Block',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001'
    },
    expertiseDomains: ['Administration', 'System Management'],
    committeeMemberships: [],
    isActive: true
  },
  {
    fullName: 'Regular User',
    email: 'user-bs@gmail.com',
    passwordHash: 'userpass',
    roles: ['USER'],
    designation: 'Research Scholar',
    organisationName: 'Indian Institute of Technology',
    organisationType: 'INDIAN_ACADEMIC_RESEARCH',
    country: 'India',
    phoneNumber: '+91-9876543211',
    address: {
      line1: 'IIT Campus',
      line2: 'Research Block',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076'
    },
    expertiseDomains: ['Coal Mining', 'Mineral Processing'],
    committeeMemberships: [],
    isActive: true
  },
  {
    fullName: 'CMPDI Member',
    email: 'cmpdi-bs@gmail.com',
    passwordHash: 'cmpdipass',
    roles: ['CMPDI_MEMBER'],
    designation: 'Senior Technical Officer',
    organisationName: 'Central Mine Planning & Design Institute',
    organisationType: 'CMPDI',
    country: 'India',
    phoneNumber: '+91-9876543212',
    address: {
      line1: 'CMPDI Headquarters',
      line2: 'Technical Wing',
      city: 'Ranchi',
      state: 'Jharkhand',
      postalCode: '834008'
    },
    expertiseDomains: ['Mine Planning', 'Technical Review', 'Feasibility Studies'],
    committeeMemberships: [
      {
        committeeType: 'CMPDI',
        position: 'Technical Reviewer'
      }
    ],
    isActive: true
  },
  {
    fullName: 'Expert Reviewer',
    email: 'expert-bs@gmail.com',
    passwordHash: 'expertpass',
    roles: ['EXPERT_REVIEWER'],
    designation: 'Professor & Domain Expert',
    organisationName: 'Indian School of Mines',
    organisationType: 'INDIAN_ACADEMIC_RESEARCH',
    country: 'India',
    phoneNumber: '+91-9876543213',
    address: {
      line1: 'ISM Campus',
      line2: 'Mining Engineering Department',
      city: 'Dhanbad',
      state: 'Jharkhand',
      postalCode: '826004'
    },
    expertiseDomains: ['Mining Technology', 'Coal Beneficiation', 'Environmental Impact'],
    committeeMemberships: [
      {
        committeeType: 'OTHER',
        position: 'External Expert'
      }
    ],
    isActive: true
  },
  {
    fullName: 'TSSRC Member',
    email: 'tssrc-bs@gmail.com',
    passwordHash: 'tssrcpass',
    roles: ['TSSRC_MEMBER'],
    designation: 'Technical Sub-Committee Chairperson',
    organisationName: 'Ministry of Coal',
    organisationType: 'INDIAN_GOVT_ORGANISATION',
    country: 'India',
    phoneNumber: '+91-9876543214',
    address: {
      line1: 'Shastri Bhawan',
      line2: 'Ministry of Coal',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001'
    },
    expertiseDomains: ['Policy Review', 'Technical Assessment', 'Project Evaluation'],
    committeeMemberships: [
      {
        committeeType: 'TSSRC',
        position: 'Committee Member'
      }
    ],
    isActive: true
  },
  {
    fullName: 'SSRC Member',
    email: 'ssrc-bs@gmail.com',
    passwordHash: 'ssrcpass',
    roles: ['SSRC_MEMBER'],
    designation: 'Standing Scientific Research Committee Member',
    organisationName: 'Coal India Limited',
    organisationType: 'PUBLIC_SECTOR_SUBSIDIARY',
    country: 'India',
    phoneNumber: '+91-9876543215',
    address: {
      line1: 'Coal Bhawan',
      line2: 'Core-2, Premise No. 04',
      city: 'Kolkata',
      state: 'West Bengal',
      postalCode: '700156'
    },
    expertiseDomains: ['Strategic Planning', 'Research Coordination', 'Final Approval'],
    committeeMemberships: [
      {
        committeeType: 'SSRC',
        position: 'Committee Member'
      }
    ],
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing users (optional - comment out if you want to keep existing data)
    const deleteCount = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deleteCount.deletedCount} existing users`);

    // Create users
    console.log('\n📝 Creating users...\n');
    
    for (const userData of mockUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✅ Created ${user.roles.join(', ')}: ${user.email}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n✨ User seeding completed!\n');
    console.log('📋 Summary:');
    console.log('─'.repeat(50));
    
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    const roleStats = await User.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nUsers by role:');
    roleStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n✅ Done! You can now use these credentials to login.');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run the seed function
seedUsers();
