import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import StatusHistory from '../models/StatusHistory.js';

// ============= CORE CRUD OPERATIONS =============

// @desc    Create new proposal
// @route   POST /api/proposals
// @access  Private (USER, SUPER_ADMIN)
export const createProposal = async (req, res) => {
  try {
    const {
      title,
      researchFundingMethod,
      principalImplementingAgency,
      subImplementingAgency,
      projectLeader,
      projectCoordinator,
      projectDuration,
      projectOutlay,
      coInvestigators,
      forms,
      tags,
      priority
    } = req.body;

    // Validation
    if (!title || !researchFundingMethod || !principalImplementingAgency || 
        !subImplementingAgency || !projectLeader || !projectCoordinator || 
        !projectDuration || !projectOutlay) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const proposalData = {
      title,
      researchFundingMethod,
      principalImplementingAgency,
      subImplementingAgency,
      projectLeader,
      projectCoordinator,
      projectDuration: parseInt(projectDuration),
      projectOutlay,
      createdBy: req.user._id,
      coInvestigators: coInvestigators || [],
      forms: forms || [],
      tags: tags || [],
      priority: priority || 'medium',
      status: 'draft',
      // Add creator as principal investigator in collaborators
      collaborators: [{
        user: req.user._id,
        role: 'principal_investigator',
        permissions: {
          canEdit: true,
          canComment: true,
          canInvite: true
        },
        status: 'accepted'
      }]
    };

    const proposal = await Proposal.create(proposalData);

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('createdBy coInvestigators', 'fullName email')
      .populate('collaborators.user', 'fullName email');

    console.log(`✅ Proposal created: ${proposal.proposalNumber} by ${req.user.fullName}`);

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      proposal: populatedProposal
    });

  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating proposal',
      error: error.message
    });
  }
};

// @desc    Get all proposals (filtered by role)
// @route   GET /api/proposals
// @access  Private
export const getProposals = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10, search } = req.query;
    
    const proposals = await Proposal.getProposalsByRole(req.user._id, req.user.roles);
    
    // Apply filters
    let filteredProposals = proposals;
    
    if (status) {
      filteredProposals = filteredProposals.filter(p => p.status === status);
    }
    
    if (priority) {
      filteredProposals = filteredProposals.filter(p => p.priority === priority);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProposals = filteredProposals.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.proposalNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      count: filteredProposals.length,
      page: parseInt(page),
      pages: Math.ceil(filteredProposals.length / limit),
      proposals: paginatedProposals
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals',
      error: error.message
    });
  }
};

// @desc    Get user's own proposals
// @route   GET /api/proposals/my-proposals
// @access  Private
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      $or: [
        { createdBy: req.user._id },
        { coInvestigators: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    })
      .populate('createdBy coInvestigators', 'fullName email')
      .populate('collaborators.user', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      proposals
    });

  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your proposals',
      error: error.message
    });
  }
};

// @desc    Get single proposal by ID
// @route   GET /api/proposals/:id
// @access  Private
export const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('createdBy coInvestigators', 'fullName email designation organisationName')
      .populate('collaborators.user', 'fullName email')
      .populate('cmpdiAssignees tssrcAssignees ssrcAssignees', 'fullName email')
      .populate('assignedExperts.expert assignedExperts.assignedBy', 'fullName email')
      .populate('comments.from', 'fullName email')
      .populate('statusHistory.changedBy', 'fullName email');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check authorization
    const isCreator = proposal.createdBy._id.toString() === req.user._id.toString();
    const isCoInvestigator = proposal.coInvestigators.some(ci => ci._id.toString() === req.user._id.toString());
    const isCollaborator = proposal.collaborators.some(c => c.user._id.toString() === req.user._id.toString());
    const isCMPDI = req.user.roles.includes('CMPDI_MEMBER') || proposal.cmpdiAssignees.some(a => a._id.toString() === req.user._id.toString());
    const isTSSRC = req.user.roles.includes('TSSRC_MEMBER') || proposal.tssrcAssignees.some(a => a._id.toString() === req.user._id.toString());
    const isSSRC = req.user.roles.includes('SSRC_MEMBER') || proposal.ssrcAssignees.some(a => a._id.toString() === req.user._id.toString());
    const isExpert = proposal.assignedExperts.some(e => e.expert._id.toString() === req.user._id.toString());
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isCreator && !isCoInvestigator && !isCollaborator && !isCMPDI && !isTSSRC && !isSSRC && !isExpert && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this proposal'
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
      message: 'Server error fetching proposal',
      error: error.message
    });
  }
};

// @desc    Update proposal metadata
// @route   PUT /api/proposals/:id
// @access  Private (USER, SUPER_ADMIN)
export const updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if user is creator or has edit permissions
    const isCreator = proposal.createdBy.toString() === req.user._id.toString();
    const collaborator = proposal.collaborators.find(c => c.user.toString() === req.user._id.toString());
    const canEdit = collaborator?.permissions.canEdit || false;
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isCreator && !canEdit && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this proposal'
      });
    }

    // Can only edit drafts
    if (proposal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit proposals in draft status'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'researchFundingMethod', 'principalImplementingAgency',
      'subImplementingAgency', 'projectLeader', 'projectCoordinator',
      'projectDuration', 'projectOutlay', 'tags', 'priority'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        proposal[field] = req.body[field];
      }
    });

    await proposal.save();

    const updatedProposal = await Proposal.findById(proposal._id)
      .populate('createdBy coInvestigators', 'fullName email');

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating proposal',
      error: error.message
    });
  }
};

// @desc    Delete proposal (soft delete, only drafts)
// @route   DELETE /api/proposals/:id
// @access  Private (USER, SUPER_ADMIN)
export const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const isCreator = proposal.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this proposal'
      });
    }

    // Can only delete drafts
    if (proposal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete proposals in draft status'
      });
    }

    await proposal.deleteOne();

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting proposal',
      error: error.message
    });
  }
};

// ============= FORM-SPECIFIC OPERATIONS =============

// @desc    Get all forms from a proposal
// @route   GET /api/proposals/:id/forms
// @access  Private
export const getProposalForms = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const formsMap = proposal.getFormsMap();

    res.json({
      success: true,
      forms: proposal.forms,
      formsMap
    });

  } catch (error) {
    console.error('Get proposal forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching forms',
      error: error.message
    });
  }
};

// @desc    Get specific form content
// @route   GET /api/proposals/:id/forms/:formKey
// @access  Private
export const getProposalForm = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const form = proposal.getForm(req.params.formKey);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    res.json({
      success: true,
      form
    });

  } catch (error) {
    console.error('Get proposal form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching form',
      error: error.message
    });
  }
};

// @desc    Update specific form content
// @route   PUT /api/proposals/:id/forms/:formKey
// @access  Private (USER, SUPER_ADMIN)
export const updateProposalForm = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check permissions
    const isCreator = proposal.createdBy.toString() === req.user._id.toString();
    const collaborator = proposal.collaborators.find(c => c.user.toString() === req.user._id.toString());
    const canEdit = collaborator?.permissions.canEdit || false;
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isCreator && !canEdit && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this form'
      });
    }

    const { editorContent, yjsState, formData, wordCount, characterCount } = req.body;

    proposal.updateForm(
      req.params.formKey,
      editorContent,
      wordCount || 0,
      characterCount || 0,
      req.user._id
    );

    // Update yjsState and formData if provided
    const form = proposal.getForm(req.params.formKey);
    if (form) {
      if (yjsState) form.yjsState = Buffer.from(yjsState, 'base64');
      if (formData) form.formData = formData;
    }

    await proposal.save();

    res.json({
      success: true,
      message: 'Form updated successfully',
      form: proposal.getForm(req.params.formKey)
    });

  } catch (error) {
    console.error('Update proposal form error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating form',
      error: error.message
    });
  }
};

// @desc    Upload PDF for a specific form
// @route   POST /api/proposals/:id/forms/:formKey/upload-pdf
// @access  Private (USER, SUPER_ADMIN)
export const uploadFormPdf = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'PDF URL is required'
      });
    }

    const form = proposal.getForm(req.params.formKey);

    if (form) {
      if (!form.originalPdfs) form.originalPdfs = [];
      form.originalPdfs.push(pdfUrl);
      form.uploadedBy = req.user._id;
      form.uploadedAt = new Date();
    } else {
      // Create new form with PDF
      proposal.forms.push({
        formKey: req.params.formKey,
        formLabel: req.params.formKey,
        originalPdfs: [pdfUrl],
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      });
    }

    await proposal.save();

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      form: proposal.getForm(req.params.formKey)
    });

  } catch (error) {
    console.error('Upload form PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading PDF',
      error: error.message
    });
  }
};

// ============= SUBMISSION & STATUS =============

// @desc    Submit proposal (draft → submitted)
// @route   POST /api/proposals/:id/submit
// @access  Private (USER, SUPER_ADMIN)
export const submitProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const isCreator = proposal.createdBy.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this proposal'
      });
    }

    if (proposal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not in draft status'
      });
    }

    // Update forms from request body
    const { forms, signatures } = req.body;
    
    console.log(`📝 Updating proposal ${proposal._id} with ${forms?.length || 0} forms and signatures`);
    
    if (forms && Array.isArray(forms)) {
      forms.forEach(formData => {
        const existingFormIndex = proposal.forms.findIndex(f => f.formKey === formData.formKey);
        
        if (existingFormIndex !== -1) {
          // Update existing form
          console.log(`  ✏️ Updating form: ${formData.formKey}`);
          proposal.forms[existingFormIndex] = {
            ...proposal.forms[existingFormIndex].toObject(),
            ...formData,
            lastModified: new Date(),
            lastModifiedBy: req.user._id
          };
        } else {
          // Add new form
          console.log(`  ➕ Adding new form: ${formData.formKey}`);
          proposal.forms.push({
            ...formData,
            lastModifiedBy: req.user._id,
            uploadedBy: req.user._id
          });
        }
      });
    }

    // Store signatures in metadata
    if (signatures) {
      console.log(`  📷 Storing ${Object.keys(signatures).length} signatures in metadata`);
      proposal.metadata = {
        ...proposal.metadata,
        signatures
      };
    }

    // Validate that all required forms are present
    const requiredForms = ['formi', 'formia', 'formix', 'formx', 'formxi', 'formxii'];
    const submittedFormKeys = proposal.forms.map(f => f.formKey);
    const missingForms = requiredForms.filter(formKey => !submittedFormKeys.includes(formKey));
    
    if (missingForms.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required forms: ${missingForms.join(', ')}`
      });
    }

    proposal.updateStatus('submitted', req.user._id);
    await proposal.save();

    console.log(`✅ Proposal ${proposal.proposalNumber} submitted by ${req.user.fullName}`);
    console.log(`   - Forms: ${proposal.forms.length}`);
    console.log(`   - Signatures: ${Object.keys(proposal.metadata?.signatures || {}).length}`);
    console.log(`   - Status: ${proposal.status}`);

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('createdBy', 'fullName email');

    res.json({
      success: true,
      message: 'Proposal submitted successfully',
      proposal: populatedProposal
    });

  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting proposal',
      error: error.message
    });
  }
};

// @desc    Update proposal status
// @route   PUT /api/proposals/:id/status
// @access  Private (Committee members, SUPER_ADMIN)
export const updateProposalStatus = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const { newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'New status is required'
      });
    }

    // Validate status transition (add your business logic)
    proposal.updateStatus(newStatus, req.user._id);
    await proposal.save();

    console.log(`🔄 Proposal ${proposal.proposalNumber} status changed to ${newStatus} by ${req.user.fullName}`);

    res.json({
      success: true,
      message: 'Proposal status updated successfully',
      proposal
    });

  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating status',
      error: error.message
    });
  }
};

// ============= ROLE-SPECIFIC PROPOSAL FETCHING =============

// @desc    Get proposals for investigator (same as my-proposals)
// @route   GET /api/proposals/investigator
// @access  Private (USER)
export const getInvestigatorProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ 
      createdBy: req.user._id
    })
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 });

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      status: proposal.status,
      stageOwner: getStageOwner(proposal.status),
      domain: proposal.tags?.[0] || 'Not specified',
      submissionDate: proposal.submittedAt,
      lastUpdated: proposal.updatedAt,
      budget: proposal.projectOutlay ? parseFloat(proposal.projectOutlay.toString()) : 0,
      hasComments: proposal.comments?.length > 0
    }));

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get investigator proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// @desc    Get proposals for CMPDI members
// @route   GET /api/proposals/cmpdi
// @access  Private (CMPDI_MEMBER)
export const getCMPDIProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      status: { 
        $in: [
          'cmpdi_review',
          'expert_review',
          'cmpdi_clarification_requested',
          'cmpdi_approved',
          'cmpdi_rejected'
        ]
      }
    })
    .populate('createdBy', 'fullName email organisationName')
    .populate('assignedExperts.expert', 'fullName email')
    .sort({ submittedAt: -1 });

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      principalInvestigator: proposal.createdBy?.fullName,
      organization: proposal.createdBy?.organisationName,
      submittedDate: proposal.submittedAt,
      domain: proposal.tags?.[0] || 'Not specified',
      subStatus: proposal.status,
      assignedExperts: proposal.assignedExperts?.map(e => e.expert?.fullName).filter(Boolean) || [],
      expertReportsReceived: proposal.assignedExperts?.filter(e => e.reviewSubmitted).length || 0,
      clarificationRequested: proposal.status === 'cmpdi_clarification_requested'
    }));

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get CMPDI proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// @desc    Get proposals for Expert Reviewers
// @route   GET /api/proposals/expert
// @access  Private (EXPERT_REVIEWER)
export const getExpertProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      'assignedExperts.expert': req.user._id
    })
    .populate('createdBy', 'fullName email organisationName')
    .sort({ submittedAt: -1 });

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => {
      const expertAssignment = proposal.assignedExperts?.find(
        e => e.expert.toString() === req.user._id.toString()
      );
      
      return {
        id: proposal._id,
        title: proposal.title,
        principalInvestigator: proposal.createdBy?.fullName,
        organization: proposal.createdBy?.organisationName,
        assignedDate: expertAssignment?.assignedAt,
        dueDate: null, // TODO: Add due date logic if needed
        reviewStatus: expertAssignment?.reviewSubmitted ? 'submitted' : 'pending',
        domain: proposal.tags?.[0] || 'Not specified'
      };
    });

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get expert proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// @desc    Get proposals for TSSRC members
// @route   GET /api/proposals/tssrc
// @access  Private (TSSRC_MEMBER)
export const getTSSRCProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      status: { 
        $in: [
          'tssrc_review',
          'tssrc_clarification_requested',
          'tssrc_approved',
          'tssrc_rejected'
        ]
      }
    })
    .populate('createdBy', 'fullName email organisationName')
    .sort({ submittedAt: -1 });

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      principalInvestigator: proposal.createdBy?.fullName,
      organization: proposal.createdBy?.organisationName,
      submittedDate: proposal.submittedAt,
      subStatus: proposal.status,
      cmpdiSummary: proposal.cmpdiReview?.remarks || 'Pending',
      domain: proposal.tags?.[0] || 'Not specified'
    }));

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get TSSRC proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// @desc    Get proposals for SSRC members
// @route   GET /api/proposals/ssrc
// @access  Private (SSRC_MEMBER)
export const getSSRCProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      status: { 
        $in: [
          'ssrc_review',
          'ssrc_approved',
          'ssrc_rejected'
        ]
      }
    })
    .populate('createdBy', 'fullName email organisationName')
    .sort({ submittedAt: -1 });

    // Transform data to match frontend expectations
    const transformedProposals = proposals.map(proposal => ({
      id: proposal._id,
      title: proposal.title,
      principalInvestigator: proposal.createdBy?.fullName,
      organization: proposal.createdBy?.organisationName,
      submittedDate: proposal.submittedAt,
      subStatus: proposal.status,
      tssrcSummary: proposal.tssrcReview?.remarks || 'Pending',
      cmpdiSummary: proposal.cmpdiReview?.remarks || 'Pending',
      domain: proposal.tags?.[0] || 'Not specified'
    }));

    res.json({
      success: true,
      proposals: transformedProposals
    });
  } catch (error) {
    console.error('Get SSRC proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching proposals'
    });
  }
};

// Helper function to get stage owner based on status
function getStageOwner(status) {
  if (status === 'draft') return 'Principal Investigator';
  if (status?.includes('cmpdi')) return 'CMPDI';
  if (status?.includes('expert')) return 'Expert Reviewer';
  if (status?.includes('tssrc')) return 'TSSRC';
  if (status?.includes('ssrc')) return 'SSRC';
  if (status?.includes('project')) return 'Project Team';
  return 'System';
}

// Placeholder functions for remaining endpoints
// These need full implementation based on your business logic

export const inviteCollaborator = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const respondToInvitation = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const removeCollaborator = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const updateCollaboratorPermissions = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const assignCMPDIMember = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const assignExpertReviewer = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const submitExpertReview = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const submitCMPDIDecision = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const assignTSSRCMember = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const submitTSSRCDecision = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const assignSSRCMember = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const submitSSRCDecision = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const addComment = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getComments = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const uploadDocument = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getDocuments = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const deleteDocument = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const addMonitoringLog = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getMonitoringLogs = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const triggerAIEvaluation = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getAIEvaluation = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getProposalStats = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getWorkflowTimeline = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

// ============= DRAFT SAVE/LOAD OPERATIONS =============

// @desc    Save proposal draft (create or update)
// @route   POST /api/proposals/draft
// @access  Private (USER, SUPER_ADMIN)
export const saveDraft = async (req, res) => {
  try {
    const {
      proposalId,
      title,
      researchFundingMethod,
      principalImplementingAgency,
      subImplementingAgency,
      projectLeader,
      projectCoordinator,
      projectDuration,
      projectOutlay,
      forms,
      signatures
    } = req.body;

    // If proposalId exists, update existing draft
    if (proposalId) {
      const proposal = await Proposal.findById(proposalId);

      if (!proposal) {
        return res.status(404).json({
          success: false,
          message: 'Proposal not found'
        });
      }

      // Check if user owns the proposal
      if (proposal.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this proposal'
        });
      }

      // Only allow updating drafts
      if (proposal.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Can only update proposals in draft status'
        });
      }

      // Update proposal fields
      if (title) proposal.title = title;
      if (researchFundingMethod) proposal.researchFundingMethod = researchFundingMethod;
      if (principalImplementingAgency) proposal.principalImplementingAgency = principalImplementingAgency;
      if (subImplementingAgency) proposal.subImplementingAgency = subImplementingAgency;
      if (projectLeader) proposal.projectLeader = projectLeader;
      if (projectCoordinator) proposal.projectCoordinator = projectCoordinator;
      if (projectDuration) proposal.projectDuration = parseInt(projectDuration);
      if (projectOutlay) proposal.projectOutlay = projectOutlay;

      // Update forms
      if (forms && Array.isArray(forms)) {
        forms.forEach(formData => {
          const existingFormIndex = proposal.forms.findIndex(f => f.formKey === formData.formKey);
          
          if (existingFormIndex !== -1) {
            // Update existing form
            proposal.forms[existingFormIndex] = {
              ...proposal.forms[existingFormIndex].toObject(),
              ...formData,
              lastModified: new Date(),
              lastModifiedBy: req.user._id
            };
          } else {
            // Add new form
            proposal.forms.push({
              ...formData,
              lastModifiedBy: req.user._id,
              uploadedBy: req.user._id
            });
          }
        });
      }

      // Store signatures in metadata
      if (signatures) {
        proposal.metadata = {
          ...proposal.metadata,
          signatures
        };
      }

      await proposal.save();

      const updatedProposal = await Proposal.findById(proposal._id)
        .populate('createdBy', 'fullName email');

      return res.status(200).json({
        success: true,
        message: 'Draft saved successfully',
        proposal: updatedProposal
      });
    }

    // Create new draft proposal
    const proposalData = {
      title: title || 'Untitled Proposal',
      researchFundingMethod: researchFundingMethod || 'S&T of MoC',
      principalImplementingAgency: principalImplementingAgency || '',
      subImplementingAgency: subImplementingAgency || '',
      projectLeader: projectLeader || '',
      projectCoordinator: projectCoordinator || '',
      projectDuration: projectDuration ? parseInt(projectDuration) : 12,
      projectOutlay: projectOutlay || '0',
      createdBy: req.user._id,
      forms: forms || [],
      status: 'draft',
      collaborators: [{
        user: req.user._id,
        role: 'principal_investigator',
        permissions: {
          canEdit: true,
          canComment: true,
          canInvite: true
        },
        status: 'accepted'
      }],
      metadata: signatures ? { signatures } : {}
    };

    const proposal = await Proposal.create(proposalData);

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('createdBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      proposal: populatedProposal
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving draft',
      error: error.message
    });
  }
};

// @desc    Load user's draft proposals
// @route   GET /api/proposals/drafts
// @access  Private
export const getDrafts = async (req, res) => {
  try {
    const drafts = await Proposal.find({
      createdBy: req.user._id,
      status: 'draft'
    })
      .populate('createdBy', 'fullName email')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: drafts.length,
      drafts
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching drafts',
      error: error.message
    });
  }
};
