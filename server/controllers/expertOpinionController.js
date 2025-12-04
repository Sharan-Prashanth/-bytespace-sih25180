import ExpertOpinion from '../models/ExpertOpinion.js';
import Proposal from '../models/Proposal.js';

// Create or update expert opinion
export const submitOpinion = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { rating, opinion } = req.body;
    const userId = req.user._id;
    const userRoles = req.user.roles || [];

    // Validate input - at least rating or opinion must be provided
    const hasRating = rating !== undefined && rating !== null && rating > 0;
    const hasOpinion = opinion && opinion.trim().length > 0;

    if (!hasRating && !hasOpinion) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating or an opinion (or both)'
      });
    }

    // Validate rating if provided (supports 0.5 increments)
    if (hasRating) {
      const ratingNum = parseFloat(rating);
      if (ratingNum < 0.5 || ratingNum > 5 || (ratingNum * 2) % 1 !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 0.5 and 5 in 0.5 increments'
        });
      }
    }

    // Validate opinion if provided
    if (hasOpinion && opinion.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Opinion must be at least 10 characters if provided'
      });
    }

    // Check if proposal exists
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Determine reviewer role (priority order)
    let reviewerRole = null;
    if (userRoles.includes('SUPER_ADMIN')) {
      reviewerRole = 'SUPER_ADMIN';
    } else if (userRoles.includes('SSRC_MEMBER')) {
      reviewerRole = 'SSRC_MEMBER';
    } else if (userRoles.includes('TSSRC_MEMBER')) {
      reviewerRole = 'TSSRC_MEMBER';
    } else if (userRoles.includes('CMPDI_MEMBER')) {
      reviewerRole = 'CMPDI_MEMBER';
    } else if (userRoles.includes('EXPERT_REVIEWER')) {
      reviewerRole = 'EXPERT_REVIEWER';
    }

    if (!reviewerRole) {
      return res.status(403).json({
        success: false,
        message: 'Only reviewers and committee members can submit opinions'
      });
    }

    // Check if user has already submitted opinion
    const existingOpinion = await ExpertOpinion.findOne({
      proposal: proposalId,
      reviewer: userId
    });

    if (existingOpinion) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted your opinion for this proposal'
      });
    }

    // Create new opinion with optional fields
    const opinionData = {
      proposal: proposalId,
      reviewer: userId,
      reviewerRole
    };

    if (hasRating) {
      opinionData.rating = parseFloat(rating);
    }

    if (hasOpinion) {
      opinionData.opinion = opinion.trim();
    }

    const newOpinion = await ExpertOpinion.create(opinionData);

    // Populate reviewer info
    await newOpinion.populate('reviewer', 'name email roles designation institution');

    res.status(201).json({
      success: true,
      message: 'Opinion submitted successfully',
      data: newOpinion
    });

  } catch (error) {
    console.error('Error submitting opinion:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted your opinion for this proposal'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit opinion',
      error: error.message
    });
  }
};

// Get all opinions for a proposal
export const getOpinions = async (req, res) => {
  try {
    const { proposalId } = req.params;

    // Check if proposal exists
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const opinions = await ExpertOpinion.getOpinionsForProposal(proposalId);
    const stats = await ExpertOpinion.getAverageRating(proposalId);

    res.json({
      success: true,
      data: {
        opinions,
        stats: {
          count: stats.count,
          averageRating: stats.average ? parseFloat(stats.average.toFixed(1)) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching opinions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opinions',
      error: error.message
    });
  }
};

// Check if user has submitted opinion
export const checkUserOpinion = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user._id;

    const hasSubmitted = await ExpertOpinion.hasUserSubmittedOpinion(proposalId, userId);
    
    let userOpinion = null;
    if (hasSubmitted) {
      userOpinion = await ExpertOpinion.findOne({
        proposal: proposalId,
        reviewer: userId
      }).populate('reviewer', 'fullName email');
    }

    res.json({
      success: true,
      data: {
        hasOpinion: hasSubmitted,
        opinion: userOpinion
      }
    });

  } catch (error) {
    console.error('Error checking user opinion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check opinion status',
      error: error.message
    });
  }
};

// Get opinion stats for a proposal
export const getOpinionStats = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const stats = await ExpertOpinion.getAverageRating(proposalId);

    res.json({
      success: true,
      data: {
        count: stats.count,
        averageRating: stats.average ? parseFloat(stats.average.toFixed(1)) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching opinion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opinion stats',
      error: error.message
    });
  }
};
