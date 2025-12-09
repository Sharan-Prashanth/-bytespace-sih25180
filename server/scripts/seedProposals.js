import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proposal from '../models/Proposal.js';
import ProposalVersion from '../models/ProposalVersion.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import ChatMessage from '../models/ChatMessage.js';
import Report from '../models/Report.js';

dotenv.config();

// Mock Plate.js content for different versions - Realistic research proposal content
const mockFormContentV1 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal - Initial Submission' }]
  },
  {
    type: 'h2',
    children: [{ text: '1. Project Title' }]
  },
  {
    type: 'p',
    children: [{ text: 'Development of Advanced Safety Monitoring Systems for Underground Coal Mining Operations' }]
  },
  {
    type: 'h2',
    children: [{ text: '2. Introduction and Background' }]
  },
  {
    type: 'p',
    children: [{ text: 'Underground coal mining operations in India face significant safety challenges including gas accumulation, roof falls, and equipment failures. This research proposes to develop an integrated monitoring system that combines IoT sensors, real-time data analytics, and predictive algorithms to enhance mine safety.' }]
  },
  {
    type: 'h2',
    children: [{ text: '3. Objectives' }]
  },
  {
    type: 'p',
    children: [{ text: 'The primary objectives of this research project are:' }]
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Design and develop a network of wireless sensors for monitoring gas levels, temperature, and structural integrity' }] },
      { type: 'li', children: [{ text: 'Create a centralized data processing system with real-time analytics capabilities' }] },
      { type: 'li', children: [{ text: 'Implement machine learning algorithms for predictive maintenance and hazard detection' }] },
      { type: 'li', children: [{ text: 'Conduct field trials at partner mining facilities' }] }
    ]
  },
  {
    type: 'h2',
    children: [{ text: '4. Methodology' }]
  },
  {
    type: 'p',
    children: [{ text: 'The research methodology involves a phased approach starting with literature review and requirement analysis, followed by system design, prototype development, laboratory testing, and finally field deployment. We will collaborate with Coal India Limited for field testing access.' }]
  },
  {
    type: 'h2',
    children: [{ text: '5. Expected Outcomes' }]
  },
  {
    type: 'p',
    children: [{ text: 'Upon successful completion, this project will deliver a fully functional safety monitoring system, comprehensive technical documentation, training materials, and recommendations for industry-wide deployment.' }]
  },
  {
    type: 'h2',
    children: [{ text: '6. Budget Summary' }]
  },
  {
    type: 'p',
    children: [{ text: 'Total project budget: Rs. 150 Lakhs over 24 months. This includes equipment procurement, personnel costs, field testing expenses, and contingency reserves.' }]
  }
];

const mockFormContentV2 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal - Revised Version' }]
  },
  {
    type: 'h2',
    children: [{ text: '1. Project Title' }]
  },
  {
    type: 'p',
    children: [{ text: 'Development of Advanced Safety Monitoring Systems for Underground Coal Mining Operations - Enhanced Scope' }]
  },
  {
    type: 'h2',
    children: [{ text: '2. Introduction and Background' }]
  },
  {
    type: 'p',
    children: [{ text: 'Underground coal mining operations in India face significant safety challenges including gas accumulation, roof falls, and equipment failures. Based on CMPDI feedback, this revised proposal includes enhanced scope covering multi-hazard monitoring and integration with existing SCADA systems.' }]
  },
  {
    type: 'h2',
    children: [{ text: '3. Objectives (Revised)' }]
  },
  {
    type: 'p',
    children: [{ text: 'The revised objectives incorporate expert feedback and industry requirements:' }]
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Design and develop an intrinsically safe sensor network for hazardous environments' }] },
      { type: 'li', children: [{ text: 'Create a fault-tolerant data processing system with 99.9% uptime guarantee' }] },
      { type: 'li', children: [{ text: 'Implement advanced ML algorithms including anomaly detection and trend analysis' }] },
      { type: 'li', children: [{ text: 'Develop mobile applications for supervisors and safety officers' }] },
      { type: 'li', children: [{ text: 'Conduct extended field trials at multiple mining sites' }] }
    ]
  },
  {
    type: 'h2',
    children: [{ text: '4. Methodology (Updated)' }]
  },
  {
    type: 'p',
    children: [{ text: 'The updated methodology addresses reviewer concerns by adding comprehensive risk assessment phases and stakeholder consultation rounds. Extended timeline accommodates additional testing requirements.' }]
  },
  {
    type: 'h2',
    children: [{ text: '5. Technical Specifications' }]
  },
  {
    type: 'p',
    children: [{ text: 'Detailed technical specifications have been added per CMPDI recommendations, including sensor accuracy requirements, communication protocols, and integration standards with existing mining infrastructure.' }]
  },
  {
    type: 'h2',
    children: [{ text: '6. Budget Summary (Revised)' }]
  },
  {
    type: 'p',
    children: [{ text: 'Revised total project budget: Rs. 200 Lakhs over 30 months. Budget increase accommodates additional equipment, extended testing, and comprehensive documentation requirements.' }]
  }
];

const mockFormContentV3 = [
  {
    type: 'h1',
    children: [{ text: 'Research Proposal - Final Version' }]
  },
  {
    type: 'h2',
    children: [{ text: '1. Project Title' }]
  },
  {
    type: 'p',
    children: [{ text: 'Integrated Multi-Hazard Safety Monitoring System for Underground Coal Mining - Comprehensive Implementation Plan' }]
  },
  {
    type: 'h2',
    children: [{ text: '2. Executive Summary' }]
  },
  {
    type: 'p',
    children: [{ text: 'This final proposal incorporates all feedback from CMPDI technical review, expert assessments, and TSSRC recommendations. The project aims to revolutionize mine safety through cutting-edge technology integration.' }]
  },
  {
    type: 'h2',
    children: [{ text: '3. Objectives (Final)' }]
  },
  {
    type: 'ul',
    children: [
      { type: 'li', children: [{ text: 'Deploy intrinsically safe sensor networks across 5 pilot mine sites' }] },
      { type: 'li', children: [{ text: 'Achieve real-time monitoring with less than 100ms latency' }] },
      { type: 'li', children: [{ text: 'Implement AI-driven predictive analytics with 95% accuracy' }] },
      { type: 'li', children: [{ text: 'Develop comprehensive training program for mine personnel' }] },
      { type: 'li', children: [{ text: 'Create scalable architecture for national deployment' }] }
    ]
  },
  {
    type: 'h2',
    children: [{ text: '4. Risk Assessment' }]
  },
  {
    type: 'p',
    children: [{ text: 'Comprehensive risk assessment added per TSSRC requirements, covering technical risks, implementation challenges, and mitigation strategies. Contingency plans developed for all identified high-priority risks.' }]
  },
  {
    type: 'h2',
    children: [{ text: '5. Implementation Timeline' }]
  },
  {
    type: 'p',
    children: [{ text: 'Detailed 24-month implementation timeline with quarterly milestones, deliverables, and review checkpoints. Phase-wise budget allocation aligned with project milestones.' }]
  },
  {
    type: 'h2',
    children: [{ text: '6. Budget and Resource Allocation' }]
  },
  {
    type: 'p',
    children: [{ text: 'Final budget: Rs. 280 Lakhs over 24 months. Includes detailed breakdown for equipment, personnel, testing, documentation, and 10% contingency reserve.' }]
  },
  {
    type: 'h2',
    children: [{ text: '7. Expected Impact' }]
  },
  {
    type: 'p',
    children: [{ text: 'Projected 40% reduction in mining accidents at pilot sites. Technology transfer potential for national implementation. Creation of indigenous safety monitoring capabilities.' }]
  }
];

// Helper to create form structure
const createFormData = (content) => ({
  formi: { content, wordCount: 500, characterCount: 2500 }
});

// Helper to build collaborators based on status and available users
const buildCollaborators = async (status, piId, users) => {
  const collaborators = [{ userId: piId, role: 'PI', addedAt: new Date() }];
  
  const statusCollaboratorMap = {
    'CMPDI_REVIEW': ['cmpdi'],
    'CMPDI_EXPERT_REVIEW': ['cmpdi', 'expert'],
    'CMPDI_ACCEPTED': ['cmpdi', 'expert'],
    'CMPDI_REJECTED': ['cmpdi', 'expert'],
    'TSSRC_REVIEW': ['cmpdi', 'expert', 'tssrc'],
    'TSSRC_ACCEPTED': ['cmpdi', 'expert', 'tssrc'],
    'TSSRC_REJECTED': ['cmpdi', 'expert', 'tssrc'],
    'SSRC_REVIEW': ['cmpdi', 'expert', 'tssrc', 'ssrc'],
    'SSRC_ACCEPTED': ['cmpdi', 'expert', 'tssrc', 'ssrc'],
    'SSRC_REJECTED': ['cmpdi', 'expert', 'tssrc', 'ssrc']
  };

  const roleMapping = {
    'cmpdi': { users: users.cmpdiMembers, role: 'CMPDI' },
    'expert': { users: users.expertReviewers, role: 'REVIEWER' },
    'tssrc': { users: users.tssrcMembers, role: 'TSSRC' },
    'ssrc': { users: users.ssrcMembers, role: 'SSRC' }
  };

  const requiredRoles = statusCollaboratorMap[status] || [];
  
  for (const roleKey of requiredRoles) {
    const mapping = roleMapping[roleKey];
    if (mapping && mapping.users) {
      for (const user of mapping.users) {
        if (!collaborators.some(c => c.userId.toString() === user._id.toString())) {
          collaborators.push({
            userId: user._id,
            role: mapping.role,
            addedAt: new Date()
          });
        }
      }
    }
  }

  return collaborators;
};

// Helper to build assigned reviewers
const buildAssignedReviewers = (expertReviewers, assignedById) => {
  return expertReviewers.map(expert => ({
    reviewer: expert._id,
    assignedBy: assignedById,
    assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'IN_PROGRESS'
  }));
};

const seedProposals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    console.log('\nClearing existing proposals...');
    await Proposal.deleteMany({});
    await ProposalVersion.deleteMany({});
    await Comment.deleteMany({});
    await ChatMessage.deleteMany({});
    await Report.deleteMany({});

    // Get PI user
    const pi1 = await User.findOne({ email: 'userbytespace@gmail.com' });
    
    if (!pi1) {
      console.error('PI user not found. Please run seed:users first.');
      process.exit(1);
    }

    // Get ALL users with specific roles (not just single test accounts)
    const cmpdiMembers = await User.find({ roles: 'CMPDI_MEMBER', isActive: true });
    const expertReviewers = await User.find({ roles: 'EXPERT_REVIEWER', isActive: true });
    const tssrcMembers = await User.find({ roles: 'TSSRC_MEMBER', isActive: true });
    const ssrcMembers = await User.find({ roles: 'SSRC_MEMBER', isActive: true });

    console.log('\nFound role-based users:');
    console.log(`  CMPDI Members:    ${cmpdiMembers.length}`);
    console.log(`  Expert Reviewers: ${expertReviewers.length}`);
    console.log(`  TSSRC Members:    ${tssrcMembers.length}`);
    console.log(`  SSRC Members:     ${ssrcMembers.length}`);

    if (cmpdiMembers.length === 0 || expertReviewers.length === 0 || tssrcMembers.length === 0 || ssrcMembers.length === 0) {
      console.error('\nRequired role users not found. Please run seed:users first.');
      process.exit(1);
    }

    const users = { cmpdiMembers, expertReviewers, tssrcMembers, ssrcMembers };
    const firstCmpdi = cmpdiMembers[0];
    const firstTssrc = tssrcMembers[0];
    const firstSsrc = ssrcMembers[0];

    console.log('\nCreating proposals...\n');

    // ========================================
    // Proposal 1: DRAFT (Version 0.1 - not submitted yet)
    // ========================================
    const proposal1 = await Proposal.create({
      proposalCode: 'PROP-2025-0001',
      title: 'Advanced Coal Mining Safety System',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Indian Institute of Technology, Mumbai',
      subAgencies: [],
      projectLeader: 'Dr. Rajesh Kumar',
      projectCoordinator: 'Prof. Anita Sharma',
      durationMonths: 24,
      outlayLakhs: 150,
      status: 'DRAFT',
      currentVersion: 0.1,
      createdBy: pi1._id,
      collaborators: [{ userId: pi1._id, role: 'PI', addedAt: new Date() }],
      formi: createFormData(mockFormContentV1)
    });
    console.log(`[CREATED] DRAFT proposal: ${proposal1.proposalCode} (Version 0.1)`);

    // ========================================
    // Proposal 2: CMPDI_REVIEW (Version 1)
    // All CMPDI members can review
    // ========================================
    const proposal2Collaborators = await buildCollaborators('CMPDI_REVIEW', pi1._id, users);
    const proposal2 = await Proposal.create({
      proposalCode: 'PROP-2025-0002',
      title: 'Sustainable Coal Extraction Technologies',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'National Institute of Technology, Rourkela',
      subAgencies: ['CMPDI'],
      projectLeader: 'Dr. Suresh Patel',
      projectCoordinator: 'Dr. Meena Rao',
      durationMonths: 36,
      outlayLakhs: 250,
      status: 'CMPDI_REVIEW',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: proposal2Collaborators,
      formi: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0002-v1.pdf',
        generatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal2._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0002-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`[CREATED] CMPDI_REVIEW proposal: ${proposal2.proposalCode} (Version 1) - ${cmpdiMembers.length} CMPDI member(s) assigned`);

    // ========================================
    // Proposal 3: CMPDI_EXPERT_REVIEW (Version 1)
    // All CMPDI members + All Expert Reviewers can review
    // ========================================
    const proposal3Collaborators = await buildCollaborators('CMPDI_EXPERT_REVIEW', pi1._id, users);
    const proposal3 = await Proposal.create({
      proposalCode: 'PROP-2025-0003',
      title: 'Environmental Impact Assessment of Underground Mining',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Indian School of Mines, Dhanbad',
      subAgencies: [],
      projectLeader: 'Prof. Vikram Singh',
      projectCoordinator: 'Dr. Priya Nair',
      durationMonths: 18,
      outlayLakhs: 120,
      status: 'CMPDI_EXPERT_REVIEW',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: proposal3Collaborators,
      assignedReviewers: buildAssignedReviewers(expertReviewers, firstCmpdi._id),
      formi: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_EXPERT_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0003-v1.pdf',
        generatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal3._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0003-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal3._id,
      author: firstCmpdi._id,
      content: 'Please review the environmental impact section in detail and provide your technical assessment.',
      type: 'CLARIFICATION'
    });

    console.log(`[CREATED] CMPDI_EXPERT_REVIEW proposal: ${proposal3.proposalCode} (Version 1) - ${expertReviewers.length} expert(s) assigned`);

    // ========================================
    // Proposal 4: TSSRC_REVIEW with Multiple Versions (Version 1, 2)
    // All CMPDI + Expert + TSSRC members can review
    // ========================================
    const proposal4Collaborators = await buildCollaborators('TSSRC_REVIEW', pi1._id, users);
    const proposal4Forms = createFormData(mockFormContentV2);
    const proposal4 = await Proposal.create({
      proposalCode: 'PROP-2025-0004',
      title: 'Automation in Coal Transportation Systems',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'IIT Kharagpur',
      subAgencies: ['Coal India Limited'],
      projectLeader: 'Dr. Amit Das',
      projectCoordinator: 'Prof. Ritu Gupta',
      durationMonths: 30,
      outlayLakhs: 300,
      status: 'TSSRC_REVIEW',
      currentVersion: 2,
      createdBy: pi1._id,
      collaborators: proposal4Collaborators,
      formi: proposal4Forms,
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: firstTssrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [
        { version: 1, reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0004-v1.pdf', generatedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
        { version: 2, reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0004-v2.pdf', generatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
      ]
    });

    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: 24,
        outlayLakhs: 250
      },
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0004-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });

    await ProposalVersion.create({
      proposalId: proposal4._id,
      versionNumber: 2,
      commitMessage: 'Updated based on CMPDI feedback - revised budget and extended timeline',
      formi: proposal4Forms,
      proposalInfo: {
        title: proposal4.title,
        fundingMethod: proposal4.fundingMethod,
        principalAgency: proposal4.principalAgency,
        subAgencies: proposal4.subAgencies,
        projectLeader: proposal4.projectLeader,
        projectCoordinator: proposal4.projectCoordinator,
        durationMonths: 30,
        outlayLakhs: 300
      },
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0004-v2.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal4._id,
      author: firstCmpdi._id,
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

    console.log(`[CREATED] TSSRC_REVIEW proposal: ${proposal4.proposalCode} (Version 2) - ${tssrcMembers.length} TSSRC member(s) assigned`);

    // ========================================
    // Proposal 5: SSRC_REVIEW with 3 Versions (Version 1, 2, 3)
    // All roles can review
    // ========================================
    const proposal5Collaborators = await buildCollaborators('SSRC_REVIEW', pi1._id, users);
    const proposal5Forms = createFormData(mockFormContentV3);
    const proposal5 = await Proposal.create({
      proposalCode: 'PROP-2025-0005',
      title: 'AI-Based Mineral Quality Detection System',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'IIT Delhi',
      subAgencies: ['CMPDI', 'Coal India Limited'],
      projectLeader: 'Dr. Kavita Verma',
      projectCoordinator: 'Prof. Sanjay Mehta',
      durationMonths: 24,
      outlayLakhs: 280,
      status: 'SSRC_REVIEW',
      currentVersion: 3,
      createdBy: pi1._id,
      collaborators: proposal5Collaborators,
      formi: proposal5Forms,
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: firstTssrc._id, changedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_ACCEPTED', changedBy: firstTssrc._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: firstSsrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [
        { version: 1, reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v1.pdf', generatedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000) },
        { version: 2, reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v2.pdf', generatedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000) },
        { version: 3, reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v3.pdf', generatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) }
      ]
    });

    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
      proposalInfo: {
        title: 'AI-Based Mineral Quality Detection',
        fundingMethod: proposal5.fundingMethod,
        principalAgency: proposal5.principalAgency,
        subAgencies: [],
        projectLeader: proposal5.projectLeader,
        projectCoordinator: proposal5.projectCoordinator,
        durationMonths: 18,
        outlayLakhs: 200
      },
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    });

    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 2,
      commitMessage: 'Incorporated CMPDI technical suggestions and added sub-agencies',
      formi: createFormData(mockFormContentV2),
      proposalInfo: {
        title: 'AI-Based Mineral Quality Detection System',
        fundingMethod: proposal5.fundingMethod,
        principalAgency: proposal5.principalAgency,
        subAgencies: ['CMPDI'],
        projectLeader: proposal5.projectLeader,
        projectCoordinator: proposal5.projectCoordinator,
        durationMonths: 24,
        outlayLakhs: 250
      },
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v2.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    });

    await ProposalVersion.create({
      proposalId: proposal5._id,
      versionNumber: 3,
      commitMessage: 'Final revisions per TSSRC requirements - added risk assessment and expanded scope',
      formi: proposal5Forms,
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
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0005-v3.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal5._id,
      author: firstCmpdi._id,
      content: 'Please add more technical details about the AI algorithms and include CMPDI as a sub-agency.',
      type: 'SUGGESTION',
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal5._id,
      author: firstTssrc._id,
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

    console.log(`[CREATED] SSRC_REVIEW proposal: ${proposal5.proposalCode} (Version 3) - ${ssrcMembers.length} SSRC member(s) assigned`);

    // ========================================
    // Proposal 6: SSRC_ACCEPTED (Fully Approved)
    // ========================================
    const proposal6Collaborators = await buildCollaborators('SSRC_ACCEPTED', pi1._id, users);
    const proposal6 = await Proposal.create({
      proposalCode: 'PROP-2025-0006',
      title: 'Smart Mine Ventilation Control System',
      fundingMethod: 'R&D of CIL',
      principalAgency: 'BITS Pilani',
      subAgencies: ['SCCL'],
      projectLeader: 'Dr. Ramesh Iyer',
      projectCoordinator: 'Prof. Sunita Joshi',
      durationMonths: 18,
      outlayLakhs: 180,
      status: 'SSRC_ACCEPTED',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: proposal6Collaborators,
      formi: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_ACCEPTED', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_REVIEW', changedBy: firstTssrc._id, changedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { status: 'TSSRC_ACCEPTED', changedBy: firstTssrc._id, changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_REVIEW', changedBy: firstSsrc._id, changedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { status: 'SSRC_ACCEPTED', changedBy: firstSsrc._id, changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0006-v1.pdf',
        generatedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal6._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0006-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    });

    console.log(`[CREATED] SSRC_ACCEPTED proposal: ${proposal6.proposalCode} (Version 1)`);

    // ========================================
    // Proposal 7: CMPDI_REJECTED
    // ========================================
    const proposal7Collaborators = await buildCollaborators('CMPDI_REJECTED', pi1._id, users);
    const proposal7 = await Proposal.create({
      proposalCode: 'PROP-2025-0007',
      title: 'Experimental Coal Processing Method',
      fundingMethod: 'S&T of MoC',
      principalAgency: 'Anna University',
      subAgencies: [],
      projectLeader: 'Dr. Karthik Raman',
      projectCoordinator: 'Prof. Lakshmi Devi',
      durationMonths: 12,
      outlayLakhs: 80,
      status: 'CMPDI_REJECTED',
      currentVersion: 1,
      createdBy: pi1._id,
      collaborators: proposal7Collaborators,
      formi: createFormData(mockFormContentV1),
      timeline: [
        { status: 'AI_EVALUATION_PENDING', changedBy: pi1._id, changedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REVIEW', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { status: 'CMPDI_REJECTED', changedBy: firstCmpdi._id, changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), notes: 'Insufficient technical details and unclear methodology' }
      ],
      aiReports: [{
        version: 1,
        reportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0007-v1.pdf',
        generatedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000)
      }]
    });

    await ProposalVersion.create({
      proposalId: proposal7._id,
      versionNumber: 1,
      commitMessage: 'Initial Submission',
      formi: createFormData(mockFormContentV1),
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
      aiReportUrl: 'https://storage.naccer.gov.in/ai-reports/PROP-2025-0007-v1.pdf',
      createdBy: pi1._id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    });

    await Comment.create({
      proposalId: proposal7._id,
      author: firstCmpdi._id,
      content: 'The methodology section lacks sufficient technical detail. The cost estimates are not properly justified. Proposal rejected.',
      type: 'COMMENT',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    console.log(`[CREATED] CMPDI_REJECTED proposal: ${proposal7.proposalCode} (Version 1)`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('Proposal seeding completed successfully');
    console.log('='.repeat(70));
    
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
    console.log(`  Draft:          ${stats.draft}`);
    console.log(`  CMPDI Review:   ${stats.cmpdiReview}`);
    console.log(`  Expert Review:  ${stats.expertReview}`);
    console.log(`  TSSRC Review:   ${stats.tssrcReview}`);
    console.log(`  SSRC Review:    ${stats.ssrcReview}`);
    console.log(`  SSRC Accepted:  ${stats.ssrcAccepted}`);
    console.log(`  Rejected:       ${stats.rejected}`);
    console.log(`  ─────────────────────`);
    console.log(`  Total:          ${Object.values(stats).reduce((a, b) => a + b, 0)}`);

    console.log('\nRole-based Auto-Assignment:');
    console.log(`  All ${cmpdiMembers.length} CMPDI member(s) assigned to proposals in CMPDI stages`);
    console.log(`  All ${expertReviewers.length} Expert Reviewer(s) assigned to proposals in Expert Review stages`);
    console.log(`  All ${tssrcMembers.length} TSSRC member(s) assigned to proposals in TSSRC stages`);
    console.log(`  All ${ssrcMembers.length} SSRC member(s) assigned to proposals in SSRC stages`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedProposals();
