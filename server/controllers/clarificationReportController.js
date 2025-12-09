import ClarificationReport from '../models/ClarificationReport.js';
import Proposal from '../models/Proposal.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3Helper.js';
import emailService from '../services/emailService.js';
import { generatePDFFromPlateContent, generateDOCXFromPlateContent } from '../utils/documentGenerator.js';

/**
 * @route   POST /api/proposals/:proposalId/clarification-reports
 * @desc    Create a new clarification report (draft)
 * @access  Private (CMPDI, TSSRC, SSRC only)
 */
export const createClarificationReport = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { title, content } = req.body;

  // Validate committee member
  const userRoles = req.user.roles || [];
  const isCMPDI = userRoles.includes('CMPDI_MEMBER');
  const isTSSRC = userRoles.includes('TSSRC_MEMBER');
  const isSSRC = userRoles.includes('SSRC_MEMBER');
  const isAdmin = userRoles.includes('SUPER_ADMIN');

  if (!isCMPDI && !isTSSRC && !isSSRC && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only committee members can create clarification reports'
    });
  }

  // Determine committee type
  let committeeType = 'CMPDI';
  if (isTSSRC) committeeType = 'TSSRC';
  if (isSSRC) committeeType = 'SSRC';

  // Validate proposal exists
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Create report
  const report = await ClarificationReport.create({
    proposalId,
    title: title || 'Clarification Request',
    content: content || [],
    createdBy: req.user._id,
    committeeType,
    status: 'DRAFT'
  });

  // Add to proposal's clarificationReports array
  proposal.clarificationReports.push(report._id);
  await proposal.save();

  res.status(201).json({
    success: true,
    message: 'Clarification report created successfully',
    data: report
  });
});

/**
 * @route   GET /api/proposals/:proposalId/clarification-reports
 * @desc    Get all clarification reports for a proposal
 * @access  Private
 */
export const getClarificationReports = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check access - proposal creator can see submitted reports
  const isProposalCreator = proposal.createdBy.toString() === req.user._id.toString();
  const userRoles = req.user.roles || [];
  const isCommittee = userRoles.includes('CMPDI_MEMBER') || 
                      userRoles.includes('TSSRC_MEMBER') || 
                      userRoles.includes('SSRC_MEMBER') ||
                      userRoles.includes('SUPER_ADMIN');

  let query = { proposalId };

  // Users can only see submitted reports
  if (isProposalCreator && !isCommittee) {
    query.status = 'SUBMITTED';
  }

  const reports = await ClarificationReport.find(query)
    .populate('createdBy', 'fullName email roles')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reports
  });
});

/**
 * @route   GET /api/clarification-reports/:reportId
 * @desc    Get a single clarification report by ID
 * @access  Private
 */
export const getClarificationReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId)
    .populate('createdBy', 'fullName email roles')
    .populate('proposalId', 'proposalCode title createdBy');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Check access
  const isReportCreator = report.createdBy._id.toString() === req.user._id.toString();
  const isProposalCreator = report.proposalId.createdBy.toString() === req.user._id.toString();
  const userRoles = req.user.roles || [];
  const isCommittee = userRoles.includes('CMPDI_MEMBER') || 
                      userRoles.includes('TSSRC_MEMBER') || 
                      userRoles.includes('SSRC_MEMBER') ||
                      userRoles.includes('SUPER_ADMIN');

  // Users can only see submitted reports
  if (!isCommittee && !isReportCreator) {
    if (!isProposalCreator || report.status !== 'SUBMITTED') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this report'
      });
    }
  }

  res.json({
    success: true,
    data: report
  });
});

/**
 * @route   PUT /api/clarification-reports/:reportId
 * @desc    Update a clarification report (draft only)
 * @access  Private (Report creator only)
 */
export const updateClarificationReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { title, content, signature } = req.body;

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can update
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reports'
    });
  }

  // Can only update drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a submitted report'
    });
  }

  // Update fields
  if (title) report.title = title;
  if (content) report.content = content;
  if (signature !== undefined) report.signature = signature;

  await report.save();

  res.json({
    success: true,
    message: 'Report updated successfully',
    data: report
  });
});

/**
 * @route   POST /api/clarification-reports/:reportId/upload-seal
 * @desc    Upload seal/stamp image for a clarification report
 * @access  Private (Report creator only)
 */
export const uploadSealImage = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can upload seal
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reports'
    });
  }

  // Can only update drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a submitted report'
    });
  }

  // Delete old seal if exists
  if (report.seal?.s3Key) {
    try {
      await deleteFromS3(report.seal.s3Key);
    } catch (err) {
      console.error('Error deleting old seal:', err);
    }
  }

  // Upload new seal
  const fileName = `clarification-reports/${reportId}/seal-${Date.now()}.${req.file.originalname.split('.').pop()}`;
  const uploadResult = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);

  report.seal = {
    url: uploadResult.url,
    s3Key: uploadResult.key
  };

  await report.save();

  res.json({
    success: true,
    message: 'Seal uploaded successfully',
    data: {
      url: uploadResult.url,
      s3Key: uploadResult.key
    }
  });
});

/**
 * @route   DELETE /api/clarification-reports/:reportId/seal
 * @desc    Remove seal/stamp image from a clarification report
 * @access  Private (Report creator only)
 */
export const removeSealImage = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can remove seal
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reports'
    });
  }

  // Can only update drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a submitted report'
    });
  }

  // Delete seal from S3
  if (report.seal?.s3Key) {
    try {
      await deleteFromS3(report.seal.s3Key);
    } catch (err) {
      console.error('Error deleting seal:', err);
    }
  }

  report.seal = undefined;
  await report.save();

  res.json({
    success: true,
    message: 'Seal removed successfully'
  });
});

/**
 * @route   POST /api/clarification-reports/:reportId/upload-image
 * @desc    Upload embedded image for clarification report content
 * @access  Private (Report creator only)
 */
export const uploadEmbeddedImage = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can upload images
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reports'
    });
  }

  // Upload image to S3
  const fileName = `clarification-reports/${reportId}/images/${Date.now()}-${req.file.originalname}`;
  const uploadResult = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);

  // Track embedded image
  report.embeddedImages.push({
    url: uploadResult.url,
    s3Key: uploadResult.key
  });

  await report.save();

  res.json({
    success: true,
    data: {
      url: uploadResult.url,
      s3Key: uploadResult.key
    }
  });
});

/**
 * @route   DELETE /api/clarification-reports/:reportId/images/:imageKey
 * @desc    Remove embedded image from clarification report
 * @access  Private (Report creator only)
 */
export const removeEmbeddedImage = asyncHandler(async (req, res) => {
  const { reportId, imageKey } = req.params;

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can remove images
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own reports'
    });
  }

  // Find image
  const imageIndex = report.embeddedImages.findIndex(img => img.s3Key === imageKey);
  
  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  // Delete from S3
  try {
    await deleteFromS3(imageKey);
  } catch (err) {
    console.error('Error deleting image from S3:', err);
  }

  // Remove from array
  report.embeddedImages.splice(imageIndex, 1);
  await report.save();

  res.json({
    success: true,
    message: 'Image removed successfully'
  });
});

/**
 * @route   POST /api/clarification-reports/:reportId/submit
 * @desc    Submit clarification report and send to proposal creator
 * @access  Private (Report creator only)
 */
export const submitClarificationReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId)
    .populate('createdBy', 'fullName email roles')
    .populate('proposalId', 'proposalCode title createdBy');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can submit
  if (report.createdBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only submit your own reports'
    });
  }

  // Can only submit drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Report has already been submitted'
    });
  }

  // Update status
  report.status = 'SUBMITTED';
  report.submittedAt = new Date();
  await report.save();

  // Get proposal creator details
  const proposal = await Proposal.findById(report.proposalId._id).populate('createdBy', 'email fullName');

  // Send email notification to proposal creator
  try {
    await emailService.sendClarificationReportEmail(
      proposal.createdBy.email,
      proposal.createdBy.fullName,
      proposal.proposalCode,
      report.title,
      report.committeeType,
      proposal._id
    );
  } catch (emailError) {
    console.error('[EMAIL ERROR] Failed to send clarification report email:', emailError);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Clarification report submitted successfully',
    data: report
  });
});

/**
 * @route   POST /api/clarification-reports/:reportId/export-pdf
 * @desc    Generate and download PDF export of clarification report
 * @access  Private
 */
export const exportReportPDF = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId)
    .populate('createdBy', 'fullName email roles')
    .populate('proposalId', 'proposalCode title');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Check access
  const isReportCreator = report.createdBy._id.toString() === req.user._id.toString();
  const isProposalCreator = report.proposalId.createdBy.toString() === req.user._id.toString();
  const userRoles = req.user.roles || [];
  const isCommittee = userRoles.includes('CMPDI_MEMBER') || 
                      userRoles.includes('TSSRC_MEMBER') || 
                      userRoles.includes('SSRC_MEMBER') ||
                      userRoles.includes('SUPER_ADMIN');

  if (!isCommittee && !isReportCreator && !isProposalCreator) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this report'
    });
  }

  // Generate PDF
  const pdfBuffer = await generatePDFFromPlateContent(
    report.content,
    report.title,
    {
      proposalCode: report.proposalId.proposalCode,
      committeeType: report.committeeType,
      createdBy: report.createdBy.fullName,
      createdAt: report.createdAt,
      signature: report.signature,
      seal: report.seal?.url
    }
  );

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${report.proposalId.proposalCode}-clarification-${report.committeeType}.pdf"`);
  
  res.send(pdfBuffer);
});

/**
 * @route   POST /api/clarification-reports/:reportId/export-docx
 * @desc    Generate and download DOCX export of clarification report
 * @access  Private
 */
export const exportReportDOCX = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId)
    .populate('createdBy', 'fullName email roles')
    .populate('proposalId', 'proposalCode title');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Check access
  const isReportCreator = report.createdBy._id.toString() === req.user._id.toString();
  const isProposalCreator = report.proposalId.createdBy.toString() === req.user._id.toString();
  const userRoles = req.user.roles || [];
  const isCommittee = userRoles.includes('CMPDI_MEMBER') || 
                      userRoles.includes('TSSRC_MEMBER') || 
                      userRoles.includes('SSRC_MEMBER') ||
                      userRoles.includes('SUPER_ADMIN');

  if (!isCommittee && !isReportCreator && !isProposalCreator) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this report'
    });
  }

  // Generate DOCX
  const docxBuffer = await generateDOCXFromPlateContent(
    report.content,
    report.title,
    {
      proposalCode: report.proposalId.proposalCode,
      committeeType: report.committeeType,
      createdBy: report.createdBy.fullName,
      createdAt: report.createdAt,
      signature: report.signature,
      seal: report.seal?.url
    }
  );

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${report.proposalId.proposalCode}-clarification-${report.committeeType}.docx"`);
  
  res.send(docxBuffer);
});

/**
 * @route   DELETE /api/clarification-reports/:reportId
 * @desc    Delete a clarification report (draft only)
 * @access  Private (Report creator only)
 */
export const deleteClarificationReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can delete
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own reports'
    });
  }

  // Can only delete drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete a submitted report'
    });
  }

  // Delete seal from S3
  if (report.seal?.s3Key) {
    try {
      await deleteFromS3(report.seal.s3Key);
    } catch (err) {
      console.error('Error deleting seal:', err);
    }
  }

  // Delete embedded images from S3
  for (const image of report.embeddedImages) {
    try {
      await deleteFromS3(image.s3Key);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  // Remove from proposal's clarificationReports array
  await Proposal.findByIdAndUpdate(
    report.proposalId,
    { $pull: { clarificationReports: report._id } }
  );

  // Delete report
  await report.deleteOne();

  res.json({
    success: true,
    message: 'Clarification report deleted successfully'
  });
});

/**
 * @route   POST /api/clarification-reports/:reportId/upload-scanned
 * @desc    Upload scanned signed copy to proposal-files bucket
 * @access  Private (Report creator only)
 */
export const uploadScannedDocument = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await ClarificationReport.findById(reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Clarification report not found'
    });
  }

  // Only report creator can upload
  if (report.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only upload to your own reports'
    });
  }

  // Check if file is uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Upload to proposal-files bucket (instead of images)
  const fileName = `clarifications/${reportId}/scanned-${Date.now()}.pdf`;
  const uploadResult = await uploadToS3(req.file.buffer, fileName, req.file.mimetype, 'proposalFiles');

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to storage'
    });
  }

  // Store scanned document reference
  if (!report.scannedDocument) {
    report.scannedDocument = {};
  }
  
  report.scannedDocument = {
    url: uploadResult.url,
    s3Key: uploadResult.key,
    uploadedAt: new Date()
  };
  
  await report.save();

  res.json({
    success: true,
    message: 'Scanned document uploaded successfully',
    data: {
      url: uploadResult.url,
      s3Key: uploadResult.key
    }
  });
});
