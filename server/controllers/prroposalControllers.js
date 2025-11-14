import Proposal from "../models/Proposal.js";
import User from "../models/User.js";
import emailService from "../services/emailService.js";

// Blockchain helpers (store approved/completed proposals on-chain via IPFS)
import fs from 'fs';
import path from 'path';
import {
  uploadFileToIPFS,
  computeFileHash,
  storeOnChain
} from '../../blockchain/utils/blockchainClient.js';

// Create a new proposal
export const createProposal = async (req, res) => {
  try {
    const { title, description, domain, budget, tags } = req.body;
    console.log(title, description, domain, budget, tags)

    // Validation
    if (!title || !description || !domain || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, domain, and budget'
      });
    }

    const proposal = await Proposal.create({
      title,
      description,
      domain,
      budget: parseFloat(budget),
      author: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: 'submitted',
      timeline: {
        submitted: new Date()
      }
    });

    const populatedProposal = await Proposal.findById(proposal._id).populate('author', 'name email');

    // Send proposal submission confirmation email
    try {
      await emailService.sendProposalStatusEmail(
        populatedProposal.author.email,
        populatedProposal.author.name,
        populatedProposal.title,
        'draft',
        'submitted',
        'System',
        'Your proposal has been successfully submitted and is now under review.'
      );
      console.log(`✅ Proposal submission email sent to ${populatedProposal.author.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send proposal submission email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      proposal: populatedProposal
    });

  } catch (error) {
    console.error('Create proposal error:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        success: false,
        message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating proposal'
    });
  }
};

// Get proposals based on user role
export const getProposals = async (req, res) => {
  try {
    let proposals;
    console.log("getProposals called for user:", req.user._id, "with role:", req.user.role);

    switch (req.user.role) {
      case 'user':
        proposals = await Proposal.find({ author: req.user._id })
          .populate('reviewer assignedStaff.user', 'name email')
          .sort({ createdAt: -1 });
        break;
        
      case 'reviewer':
        proposals = await Proposal.find({ status: { $ne: 'draft' } })
          .populate('author assignedStaff.user', 'name email')
          .sort({ createdAt: -1 });
        break;
        
      case 'staff':
        proposals = await Proposal.find({ 
          'assignedStaff.user': req.user._id,
          status: { $ne: 'draft' } 
        })
          .populate('author reviewer', 'name email')
          .sort({ createdAt: -1 });
        break;
        
      default:
        proposals = [];
    }

    res.json({
      success: true,
      count: proposals.length,
      proposals
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// Get user's own proposals
export const getMyProposals = async (req, res) => {
  try {
    console.log('Fetching proposals for user:', req.user._id);
    const proposals = await Proposal.find({ author: req.user._id })
      .populate('reviewer assignedStaff.user', 'name email')
      .sort({ createdAt: -1 });

    console.log(proposals);

    res.json({
      success: true,
      count: proposals.length,
      proposals
    });

  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your proposals'
    });
  }
};

// Get proposals assigned to staff member
export const getAssignedProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ 
      'assignedStaff.user': req.user._id,
      status: { $ne: 'draft' } 
    })
      .populate('author reviewer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      proposals
    });

  } catch (error) {
    console.error('Get assigned proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching assigned proposals'
    });
  }
};

// Get single proposal by ID
export const getProposalById = async (req, res) => {
  try {
    console.log("getProposalById called for user:", req.user._id, "with role:", req.user.role);
    const proposal = await Proposal.findById(req.params.id)
      .populate('author reviewer assignedStaff.user feedback.from', 'name email');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization
    const isAuthor = proposal.author._id.toString() === req.user._id.toString();
    const isReviewer = req.user.role === 'reviewer';
    const isAssignedStaff = proposal.assignedStaff.some(
      assignment => assignment.user._id.toString() === req.user._id.toString()
    );

    if (!isAuthor && !isReviewer && !isAssignedStaff) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this proposal'
      });
    }

    res.json({
      success: true,
      proposal
    });

  } catch (error) {
    console.error('Get proposal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposal'
    });
  }
};

// Update proposal (authors only)
export const updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if user is author
    if (proposal.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this proposal'
      });
    }

    // Check if proposal can be updated
    if (!['draft', 'needs_revision'].includes(proposal.status)) {
      return res.status(400).json({
        success: false,
        message: 'Proposal cannot be updated in its current status'
      });
    }

    const { title, description, domain, budget, tags } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (domain) updateData.domain = domain;
    if (budget) updateData.budget = parseFloat(budget);
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());

    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author reviewer assignedStaff.user', 'name email');

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating proposal'
    });
  }
};

// Add feedback to proposal (reviewers and staff)
export const addFeedback = async (req, res) => {
  try {
    const { feedback, type = 'reviewer_feedback' } = req.body;
    
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback message is required'
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Authorization check
    const isReviewer = req.user.role === 'reviewer';
    const isAssignedStaff = proposal.assignedStaff.some(
      assignment => assignment.user.toString() === req.user._id.toString()
    );

    if (!isReviewer && !isAssignedStaff) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add feedback to this proposal'
      });
    }

    await proposal.addFeedback(req.user._id, feedback, type);

    const updatedProposal = await Proposal.findById(req.params.id)
      .populate('feedback.from author', 'name email role');

    // Send feedback notification email to proposal author
    try {
      await emailService.sendFeedbackEmail(
        updatedProposal.author.email,
        updatedProposal.author.name,
        updatedProposal.title,
        req.user.name,
        feedback
      );
      console.log(`✅ Feedback notification email sent to ${updatedProposal.author.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send feedback notification email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding feedback'
    });
  }
};

// Assign staff to proposal (reviewers only)
export const assignStaff = async (req, res) => {
  try {
    const { staffId, dueDate } = req.body;
    
    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if staff member exists
    const staffMember = await User.findById(staffId);
    if (!staffMember || staffMember.role !== 'staff') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff member'
      });
    }

    await proposal.assignStaff(staffId, dueDate ? new Date(dueDate) : null);
    proposal.reviewer = req.user._id;
    await proposal.save();

    const updatedProposal = await Proposal.findById(req.params.id)
      .populate('assignedStaff.user reviewer author', 'name email');

    // Send assignment email to staff member
    try {
      await emailService.sendStaffAssignmentEmail(
        staffMember.email,
        staffMember.name,
        updatedProposal.title,
        updatedProposal.author.name,
        req.user.name
      );
      console.log(`✅ Staff assignment email sent to ${staffMember.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send staff assignment email:', emailError.message);
    }

    // Send status update email to proposal author
    try {
      await emailService.sendProposalStatusEmail(
        updatedProposal.author.email,
        updatedProposal.author.name,
        updatedProposal.title,
        updatedProposal.status,
        'assigned_to_staff',
        req.user.name,
        `Your proposal has been assigned to ${staffMember.name} for further development.`
      );
      console.log(`✅ Assignment notification email sent to ${updatedProposal.author.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send assignment notification email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Staff assigned successfully',
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning staff'
    });
  }
};

// Update proposal status (reviewers only)
export const updateProposalStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    const validStatuses = ['approved', 'rejected', 'needs_revision', 'under_review'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    proposal.status = status;
    proposal.reviewer = req.user._id;
    
    // Update timeline
    if (status === 'under_review') {
      proposal.timeline.reviewStarted = new Date();
    } else if (['approved', 'rejected'].includes(status)) {
      proposal.timeline.decision = new Date();
    }

    // Add comment as feedback if provided
    if (comment) {
      await proposal.addFeedback(req.user._id, comment, 'approval_note');
    }

    await proposal.save();

    const updatedProposal = await Proposal.findById(req.params.id)
      .populate('author reviewer assignedStaff.user', 'name email');

    // Send status update email to proposal author
    try {
      await emailService.sendProposalStatusEmail(
        updatedProposal.author.email,
        updatedProposal.author.name,
        updatedProposal.title,
        proposal.status, // old status
        status, // new status
        req.user.name,
        comment
      );
      console.log(`✅ Status update email sent to ${updatedProposal.author.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send status update email:', emailError.message);
    }

    // If proposal was approved by reviewer, persist a record on-chain (IPFS + contract)
    if (status === 'approved') {
      try {
        // Prepare payload
        const payload = {
          proposalId: updatedProposal._id.toString(),
          title: updatedProposal.title,
          author: updatedProposal.author ? (updatedProposal.author.name || updatedProposal.author.email) : null,
          domain: updatedProposal.domain,
          budget: updatedProposal.budget,
          status: updatedProposal.status,
          reviewer: req.user.name || req.user.email || req.user._id,
          decisionAt: new Date().toISOString(),
        };

        // Ensure tmp dir exists inside blockchain folder
        const tmpDir = path.join(process.cwd(), 'blockchain', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tmpFilePath = path.join(tmpDir, `${updatedProposal._id.toString()}.json`);
        fs.writeFileSync(tmpFilePath, JSON.stringify(payload, null, 2));

        // Upload to IPFS
        const cid = await uploadFileToIPFS(tmpFilePath);
        const fileHash = await computeFileHash(tmpFilePath);

        // Store reference on-chain
        const receipt = await storeOnChain(updatedProposal._id.toString(), cid, fileHash, `Approved by reviewer: ${req.user.name || req.user._id}`);
        console.log('✅ Stored approved proposal on-chain, tx receipt:', receipt.transactionHash || receipt.transactionHash === undefined ? receipt : receipt.transactionHash);

        // Optionally remove temp file
        try { fs.unlinkSync(tmpFilePath); } catch (e) { /* ignore */ }
      } catch (chainError) {
        console.error('❌ Failed to persist approved proposal on-chain:', chainError.message || chainError);
      }
    }

    res.json({
      success: true,
      message: `Proposal status updated to ${status}`,
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating proposal status'
    });
  }
};

// Submit staff report
export const submitStaffReport = async (req, res) => {
  try {
    const { report, progress, findings, recommendations, status } = req.body;
    
    if (!report && !progress) {
      return res.status(400).json({
        success: false,
        message: 'Report or progress update is required'
      });
    }

    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if user is assigned to this proposal
    const isAssigned = proposal.assignedStaff.some(
      assignment => assignment.user.toString() === req.user._id.toString()
    );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit report for this proposal'
      });
    }

    // Create comprehensive report message
    let reportMessage = '';
    if (progress) reportMessage += `Progress: ${progress}\n`;
    if (findings) reportMessage += `Findings: ${findings}\n`;
    if (recommendations) reportMessage += `Recommendations: ${recommendations}\n`;
    if (report) reportMessage += `Full Report: ${report}`;

    await proposal.addFeedback(req.user._id, reportMessage, 'staff_report');

    // Update proposal status if final report
    if (status === 'completed') {
      proposal.status = 'staff_reviewing';
    }

    await proposal.save();

    res.json({
      success: true,
      message: 'Staff report submitted successfully'
    });

    // If staff marked this report as completed, persist a record on-chain
    if (status === 'completed') {
      try {
        const payload = {
          proposalId: proposal._id.toString(),
          title: proposal.title,
          author: proposal.author,
          status: proposal.status,
          staff: req.user.name || req.user.email || req.user._id,
          completedAt: new Date().toISOString()
        };

        const tmpDir = path.join(process.cwd(), 'blockchain', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tmpFilePath = path.join(tmpDir, `${proposal._id.toString()}-staff.json`);
        fs.writeFileSync(tmpFilePath, JSON.stringify(payload, null, 2));

        const cid = await uploadFileToIPFS(tmpFilePath);
        const fileHash = await computeFileHash(tmpFilePath);
        const receipt = await storeOnChain(proposal._id.toString(), cid, fileHash, `Completed by staff: ${req.user.name || req.user._id}`);
        console.log('✅ Stored staff-completed proposal on-chain, tx receipt:', receipt.transactionHash || receipt);

        try { fs.unlinkSync(tmpFilePath); } catch (e) { /* ignore */ }
      } catch (chainError) {
        console.error('❌ Failed to persist staff-completed proposal on-chain:', chainError.message || chainError);
      }
    }

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting report'
    });
  }
};
