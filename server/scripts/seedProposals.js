import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import ChatMessage from '../models/ChatMessage.js';
import Report from '../models/Report.js';

dotenv.config();

// Mock Plate.js content for different versions
const mockFormContentV1 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal Form - Version 1' }]
  },
  {
    type: 'p',
    children: [{ text: 'This is the initial submission content for testing purposes.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Objectives' }]
  },
  {
    type: 'p',
    children: [{ text: 'The main objectives of this research project are to develop innovative solutions for coal mining industry challenges.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Methodology' }]
  },
  {
    type: 'p',
    children: [{ text: 'Our methodology involves comprehensive field studies and laboratory analysis.' }]
  }
];

const mockFormContentV2 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal Form - Version 2' }]
  },
  {
    type: 'p',
    children: [{ text: 'This is the revised version with CMPDI feedback incorporated.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Objectives' }]
  },
  {
    type: 'p',
    children: [{ text: 'The main objectives have been refined based on expert feedback to focus on specific coal mining safety challenges.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Methodology' }]
  },
  {
    type: 'p',
    children: [{ text: 'Our updated methodology includes advanced sensor technologies and real-time monitoring systems.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Budget Revisions' }]
  },
  {
    type: 'p',
    children: [{ text: 'Budget has been revised to include additional equipment costs as suggested by reviewers.' }]
  }
];

const mockFormContentV3 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal Form - Version 3' }]
  },
  {
    type: 'p',
    children: [{ text: 'This is the final revised version after TSSRC feedback.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Objectives' }]
  },
  {
    type: 'p',
    children: [{ text: 'Final objectives aligned with national coal mining safety standards and industry requirements.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Methodology' }]
  },
  {
    type: 'p',
    children: [{ text: 'Comprehensive methodology with detailed implementation phases and milestones.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Expected Outcomes' }]
  },
  {
    type: 'p',
    children: [{ text: 'Clear deliverables including prototype systems, technical reports, and deployment guidelines.' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Risk Assessment' }]
  },
  {
    type: 'p',
    children: [{ text: 'Comprehensive risk assessment and mitigation strategies added per TSSRC requirements.' }]
  }
];

// Helper to create form structure
const createFormData = (content) => ({
  formI: { formi: { content, wordCount: 500, characterCount: 2500 } },
  formIA: { formia: { content, wordCount: 300, characterCount: 1500 } },
  formIX: { formix: { content, wordCount: 200, characterCount: 1000 } },
  formX: { formx: { content, wordCount: 250, characterCount: 1250 } },
  formXI: { formxi: { content, wordCount: 150, characterCount: 750 } },
  formXII: { formxii: { content, wordCount: 100, characterCount: 500 } }
});

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

    // ========================================
    // Proposal 1: DRAFT (Version 0 - not submitted yet)
    // ========================================
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
      currentVersion: 0, // Draft - not submitted
      createdBy: pi1._id,
      collaborators: [{
        userId: pi1._id,
        role: 'PI'
      }],
      forms: createFormData(mockFormContentV1)
    });
    console.log(`✅ Created DRAFT proposal: ${proposal1.proposalCode} (Version 0 - no versions yet)`);

    // ========================================
    // Proposal 2: CMPDI_REVIEW (Version 1 - Initial Submission)
    // ========================================
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
      currentVersion: 1, // Integer version
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' }
      ],
      forms: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-2-v1.pdf',
        generatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }]
    });

    // Create Version 1 - Initial Submission
    await ProposalVersion.create({
      proposalId: proposal2._id,
      versionNumber: 1, // Integer
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://example.com/ai-report-2-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created CMPDI_REVIEW proposal: ${proposal2.proposalCode} (Version 1)`);

    // ========================================
    // Proposal 3: CMPDI_EXPERT_REVIEW (Version 1)
    // ========================================
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
      forms: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_EXPERT_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-3-v1.pdf',
        generatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal3._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://example.com/ai-report-3-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    // Add comment for expert review
    await Comment.create({
      proposalId: proposal3._id,
      author: cmpdi._id,
      content: 'Please review the environmental impact section in detail and provide your assessment.',
      type: 'CLARIFICATION'
    });

    console.log(`✅ Created CMPDI_EXPERT_REVIEW proposal: ${proposal3.proposalCode} (Version 1)`);

    // ========================================
    // Proposal 4: TSSRC_REVIEW with Multiple Versions (Version 1, 2)
    // This is perfect for testing version history!
    // ========================================
    const proposal4Forms = createFormData(mockFormContentV2);
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
      currentVersion: 2, // Integer - has 2 versions
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' },
        { userId: tssrc._id, role: 'TSSRC' }
      ],
      forms: proposal4Forms,
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
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

    // Version 1 - Initial Submission
    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: 24, // Original duration
        outlayLakhs: 250 // Original budget
      },
      aiReportUrl: 'https://example.com/ai-report-4-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    // Version 2 - Updated based on CMPDI feedback
    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 2,
      commitMessage: 'Updated based on CMPDI feedback - revised budget and extended timeline',
      forms: proposal4Forms,
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: 30, // Extended
        outlayLakhs: 300 // Increased
      },
      aiReportUrl: 'https://example.com/ai-report-4-v2.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });

    // Add comments for this proposal
    await Comment.create({
      proposalId: proposal4._id,
      author: cmpdi._id,
      content: 'Budget needs to be revised to include transportation equipment costs.',
      type: 'SUGGESTION',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal4._id,
      author: pi1._id,
      content: 'Budget has been updated in Version 2 as per your suggestion.',
      type: 'COMMENT',
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created TSSRC_REVIEW proposal: ${proposal4.proposalCode} (Version 2 - with version history)`);

    // ========================================
    // Proposal 5: SSRC_REVIEW with 3 Versions (Version 1, 2, 3)
    // Best for testing full version history!
    // ========================================
    const proposal5Forms = createFormData(mockFormContentV3);
    const proposal5 = await Proposal.create({
      proposalCode: 'PROP-2025-0005',
      title: 'AI-Based Mineral Quality Detection System',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'IIT Delhi',
      subAgencies: ['CMPDI', 'Coal India Limited'],
      projectLeader: 'Regular User',
      projectCoordinator: 'Regular User',
      durationMonths: 24,
      outlayLakhs: 280,
      status: 'SSRC_REVIEW',
      currentVersion: 3, // Has 3 versions - great for testing!
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' },
        { userId: cmpdi._id, role: 'CMPDI' },
        { userId: tssrc._id, role: 'TSSRC' },
        { userId: ssrc._id, role: 'SSRC' }
      ],
      forms: proposal5Forms,
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: tssrc._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_ACCEPTED', changedBy: tssrc._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: ssrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [
        {
          version: 1,
          reportUrl: 'https://example.com/ai-report-5-v1.pdf',
          generatedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000)
        },
        {
          version: 2,
          reportUrl: 'https://example.com/ai-report-5-v2.pdf',
          generatedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000)
        },
        {
          version: 3,
          reportUrl: 'https://example.com/ai-report-5-v3.pdf',
          generatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Version 1 - Initial Submission
    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
      proposalInfo: {
        title: 'AI-Based Mineral Quality Detection', // Original title
        fundingMethod: proposal5.fundingMethod,
        principalAgency: proposal5.principalAgency,
        subAgencies: [],
        projectLeader: proposal5.projectLeader,
        projectCoordinator: proposal5.projectCoordinator,
        durationMonths: 18,
        outlayLakhs: 200
      },
      aiReportUrl: 'https://example.com/ai-report-5-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    });

    // Version 2 - After CMPDI feedback
    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 2,
      commitMessage: 'Incorporated CMPDI technical suggestions and added sub-agencies',
      forms: createFormData(mockFormContentV2),
      proposalInfo: {
        title: 'AI-Based Mineral Quality Detection System', // Updated title
        fundingMethod: proposal5.fundingMethod,
        principalAgency: proposal5.principalAgency,
        subAgencies: ['CMPDI'],
        projectLeader: proposal5.projectLeader,
        projectCoordinator: proposal5.projectCoordinator,
        durationMonths: 24,
        outlayLakhs: 250
      },
      aiReportUrl: 'https://example.com/ai-report-5-v2.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    });

    // Version 3 - After TSSRC feedback
    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 3,
      commitMessage: 'Final revisions per TSSRC requirements - added risk assessment and expanded scope',
      forms: proposal5Forms,
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
      aiReportUrl: 'https://example.com/ai-report-5-v3.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });

    // Add comments across versions
    await Comment.create({
      proposalId: proposal5._id,
      author: cmpdi._id,
      content: 'Please add more technical details about the AI algorithms and include CMPDI as a sub-agency.',
      type: 'SUGGESTION',
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal5._id,
      author: tssrc._id,
      content: 'Good progress. Please add a comprehensive risk assessment section.',
      type: 'SUGGESTION',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal5._id,
      author: pi1._id,
      content: 'All requested changes have been incorporated in Version 3.',
      type: 'COMMENT',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created SSRC_REVIEW proposal: ${proposal5.proposalCode} (Version 3 - full version history)`);

    // ========================================
    // Proposal 6: SSRC_ACCEPTED (Version 1 - Fully Approved)
    // ========================================
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
      status: 'SSRC_ACCEPTED',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: [
        { userId: pi1._id, role: 'PI' }
      ],
      forms: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: tssrc._id, changedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_ACCEPTED', changedBy: tssrc._id, changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: ssrc._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_ACCEPTED', changedBy: ssrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-6-v1.pdf',
        generatedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal6._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://example.com/ai-report-6-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created SSRC_ACCEPTED proposal: ${proposal6.proposalCode} (Version 1)`);

    // ========================================
    // Proposal 7: REJECTED (Version 1)
    // ========================================
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
      forms: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REJECTED', changedBy: cmpdi._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), notes: 'Insufficient technical details and unclear methodology' }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://example.com/ai-report-7-v1.pdf',
        generatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal7._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      forms: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://example.com/ai-report-7-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal7._id,
      author: cmpdi._id,
      content: 'The methodology section lacks sufficient technical detail. The cost estimates are not properly justified.',
      type: 'COMMENT',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`✅ Created REJECTED proposal: ${proposal7.proposalCode} (Version 1)`);

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
      ssrcAccepted: await Proposal.countDocuments({ status: 'SSRC_ACCEPTED' }),
      rejected: await Proposal.countDocuments({ status: { $regex: 'REJECTED' } })
    };

    console.log('\nProposal Status Summary:');
    console.log(`  - Draft: ${stats.draft}`);
    console.log(`  - CMPDI Review: ${stats.cmpdiReview}`);
    console.log(`  - Expert Review: ${stats.expertReview}`);
    console.log(`  - TSSRC Review: ${stats.tssrcReview}`);
    console.log(`  - SSRC Review: ${stats.ssrcReview}`);
    console.log(`  - SSRC Accepted: ${stats.ssrcAccepted}`);
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
