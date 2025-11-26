import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import ChatMessage from '../models/ChatMessage.js';
import Report from '../models/Report.js';

dotenv.config();

// Mock Plate.js content
const mockFormContent = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal Form' }]
  },
  {
    type: 'p',
    children: [{ text: 'This is a sample form content for testing purposes.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Objectives' }]
  },
  {
    type: 'p',
    children: [{ text: 'The main objectives of this research project are to develop innovative solutions for coal mining industry challenges.' }]
  }
];

const seedProposals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data (optional)
    console.log('\nClearing existing proposals...');
    await Proposal.deleteMany({});
    await ProposalVersion.deleteMany({});
    await Comment.deleteMany({});
    await ChatMessage.deleteMany({});
    await Report.deleteMany({});

    // Get users
    const pi1 = await User.findOne({ email: 'user-bs@gmail.com' });
    const cmpdi = await User.findOne({ email: 'cmpdi-bs@gmail.com' });
    const expert = await User.findOne({ email: 'expert-bs@gmail.com' });
    const tssrc = await User.findOne({ email: 'tssrc-bs@gmail.com' });
    const ssrc = await User.findOne({ email: 'ssrc-bs@gmail.com' });

    if (!pi1 || !cmpdi || !expert || !tssrc || !ssrc) {
      console.error('Required users not found. Please run seed:users first.');
      process.exit(1);
    }

    console.log('\nCreating proposals...\n');

    // Proposal 1: Draft
    const proposal1 = await Proposal.create({
      proposalCode: 'PROP-2025-0001',
      title: 'Advanced Coal Mining Safety System',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Indian Institute of Technology, Mumbai',
      subAgencies: [],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 24,
      outlayLakhs: 150,
      status: 'DRAFT',
      currentVersion: 0.1,
      createdBy: pi1._id,
      collaborators: [{
        userId: pi1._id,
        role: 'PI'
      }],
      forms: {
        formI: mockFormContent,
        formIA: null,
        formIX: null,
        formX: null,
        formXI: null,
        formXII: null
      }
    });
    console.log(`Created DRAFT proposal: ${proposal1.proposalCode}`);

    // Proposal 2: Submitted - Under CMPDI Review
    const proposal2 = await Proposal.create({
      proposalCode: 'PROP-2025-0002',
      title: 'Sustainable Coal Extraction Technologies',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'National Institute of Technology, Rourkela',
      subAgencies: ['CMPDI'],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 36,
      outlayLakhs: 250,
      status: 'CMPDI_REVIEW',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' }
      ],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-1.pdf',
        generatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal2._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal2.forms,
      proposalInfo: {
        title: proposal2.title,
        fundingMethod: proposal2.fundingMethod,
        principalAgency: proposal2.principalAgency,
        subAgencies: proposal2.subAgencies,
        projectLeader: proposal2.projectLeader,
        projectCoordinator: proposal2.projectCoordinator,
        durationMonths: proposal2.durationMonths,
        outlayLakhs: proposal2.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-1.pdf',
      createdBy: pi1._id
    });

    console.log(`Created CMPDI_REVIEW proposal: ${proposal2.proposalCode}`);

    // Proposal 3: Expert Review
    const proposal3 = await Proposal.create({
      proposalCode: 'PROP-2025-0003',
      title: 'Environmental Impact Assessment of Underground Mining',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Indian School of Mines, Dhanbad',
      subAgencies: [],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 18,
      outlayLakhs: 120,
      status: 'CMPDI_EXPERT_REVIEW',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' },
        { userId: expert._id, role: 'REVIEWER' }
      ],
      assignedReviewers: [{
        reviewer: expert._id,
        assignedBy: cmpdi._id,
        assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'IN_PROGRESS'
      }],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_EXPERT_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-3.pdf',
        generatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal3._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal3.forms,
      proposalInfo: {
        title: proposal3.title,
        fundingMethod: proposal3.fundingMethod,
        principalAgency: proposal3.principalAgency,
        subAgencies: proposal3.subAgencies,
        projectLeader: proposal3.projectLeader,
        projectCoordinator: proposal3.projectCoordinator,
        durationMonths: proposal3.durationMonths,
        outlayLakhs: proposal3.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-3.pdf',
      createdBy: pi1._id
    });

    // Add comment for expert review
    await Comment.create({
      proposalId: proposal3._id,
      author: cmpdi._id,
      content: 'Please review the environmental impact section in detail and provide your assessment.',
      type: 'CLARIFICATION'
    });

    console.log(`Created CMPDI_EXPERT_REVIEW proposal: ${proposal3.proposalCode}`);

    // Proposal 4: CMPDI Approved - TSSRC Review
    const proposal4 = await Proposal.create({
      proposalCode: 'PROP-2025-0004',
      title: 'Automation in Coal Transportation Systems',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'IIT Kharagpur',
      subAgencies: ['Coal India Limited'],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 30,
      outlayLakhs: 300,
      status: 'TSSRC_REVIEW',
      currentVersion: 2,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' },
        { userId: tssrc._id, role: 'TSSRC' }
      ],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_APPROVED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: tssrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [
        {
          version: 1,
          reportUrl: 'https://example.com/ai-report-4-v1.pdf',
          generatedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
        },
        {
          version: 2,
          reportUrl: 'https://example.com/ai-report-4-v2.pdf',
          generatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal4.forms,
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: proposal4.durationMonths,
        outlayLakhs: proposal4.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-4-v1.pdf',
      createdBy: pi1._id
    });

    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 2,
      commitMessage: 'Updated based on CMPDI feedback',
      forms: proposal4.forms,
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: proposal4.durationMonths,
        outlayLakhs: proposal4.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-4-v2.pdf',
      createdBy: pi1._id
    });

    console.log(`Created TSSRC_REVIEW proposal: ${proposal4.proposalCode}`);

    // Proposal 5: TSSRC Approved - SSRC Review
    const proposal5 = await Proposal.create({
      proposalCode: 'PROP-2025-0005',
      title: 'AI-Based Mineral Quality Detection',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'IIT Delhi',
      subAgencies: [],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 24,
      outlayLakhs: 200,
      status: 'SSRC_REVIEW',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' },
        { userId: tssrc._id, role: 'TSSRC' },
        { userId: ssrc._id, role: 'SSRC' }
      ],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_APPROVED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: tssrc._id, changedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_APPROVED', changedBy: tssrc._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: ssrc._id, changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-5.pdf',
        generatedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal5.forms,
      proposalInfo: {
        title: proposal5.title,
        fundingMethod: proposal5.fundingMethod,
        principalAgency: proposal5.principalAgency,
        subAgencies: proposal5.subAgencies,
        projectLeader: proposal5.projectLeader,
        projectCoordinator: proposal5.projectCoordinator,
        durationMonths: proposal5.durationMonths,
        outlayLakhs: proposal5.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-5.pdf',
      createdBy: pi1._id
    });

    console.log(`Created SSRC_REVIEW proposal: ${proposal5.proposalCode}`);

    // Proposal 6: Accepted/Ongoing
    const proposal6 = await Proposal.create({
      proposalCode: 'PROP-2025-0006',
      title: 'Smart Mine Ventilation Control System',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'BITS Pilani',
      subAgencies: ['SCCL'],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 18,
      outlayLakhs: 180,
      status: 'ONGOING',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' }
      ],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_APPROVED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: tssrc._id, changedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_APPROVED', changedBy: tssrc._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: ssrc._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'ACCEPTED', changedBy: ssrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: 'ONGOING', changedBy: ssrc._id, changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-6.pdf',
        generatedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal6._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal6.forms,
      proposalInfo: {
        title: proposal6.title,
        fundingMethod: proposal6.fundingMethod,
        principalAgency: proposal6.principalAgency,
        subAgencies: proposal6.subAgencies,
        projectLeader: proposal6.projectLeader,
        projectCoordinator: proposal6.projectCoordinator,
        durationMonths: proposal6.durationMonths,
        outlayLakhs: proposal6.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-6.pdf',
      createdBy: pi1._id
    });

    console.log(`Created ONGOING proposal: ${proposal6.proposalCode}`);

    // Proposal 7: Rejected
    const proposal7 = await Proposal.create({
      proposalCode: 'PROP-2025-0007',
      title: 'Experimental Coal Processing Method',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Anna University',
      subAgencies: [],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 12,
      outlayLakhs: 80,
      status: 'CMPDI_REJECTED',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' }
      ],
      forms: {
        formI: mockFormContent,
        formIA: mockFormContent,
        formIX: mockFormContent,
        formX: mockFormContent,
        formXI: mockFormContent,
        formXII: mockFormContent
      },
      timeline: [
        { status: 'SUBMITTED', changedBy: pi1._id, changedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REJECTED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), notes: 'Insufficient technical details and unclear methodology' }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-7.pdf',
        generatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal7._id,
      versionNumber: 1,
      commitMessage: 'Initial submission',
      forms: proposal7.forms,
      proposalInfo: {
        title: proposal7.title,
        fundingMethod: proposal7.fundingMethod,
        principalAgency: proposal7.principalAgency,
        subAgencies: proposal7.subAgencies,
        projectLeader: proposal7.projectLeader,
        projectCoordinator: proposal7.projectCoordinator,
        durationMonths: proposal7.durationMonths,
        outlayLakhs: proposal7.outlayLakhs
      },
      aiReportUrl: 'https://example.com/ai-report-7.pdf',
      createdBy: pi1._id
    });

    console.log(`Created REJECTED proposal: ${proposal7.proposalCode}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Proposal seeding completed successfully!');
    console.log('='.repeat(60));
    
    const stats = {
      draft: await Proposal.countDocuments({ status: 'DRAFT' }),
      cmpdiReview: await Proposal.countDocuments({ status: 'CMPDI_REVIEW' }),
      expertReview: await Proposal.countDocuments({ status: 'CMPDI_EXPERT_REVIEW' }),
      tssrcReview: await Proposal.countDocuments({ status: 'TSSRC_REVIEW' }),
      ssrcReview: await Proposal.countDocuments({ status: 'SSRC_REVIEW' }),
      ongoing: await Proposal.countDocuments({ status: 'ONGOING' }),
      rejected: await Proposal.countDocuments({ status: { $regex: 'REJECTED' } })
    };

    console.log('\nProposal Status Summary:');
    console.log(`  - Draft: ${stats.draft}`);
    console.log(`  - CMPDI Review: ${stats.cmpdiReview}`);
    console.log(`  - Expert Review: ${stats.expertReview}`);
    console.log(`  - TSSRC Review: ${stats.tssrcReview}`);
    console.log(`  - SSRC Review: ${stats.ssrcReview}`);
    console.log(`  - Ongoing: ${stats.ongoing}`);
    console.log(`  - Rejected: ${stats.rejected}`);
    console.log(`  - Total: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedProposals();
