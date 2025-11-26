import Report from '../models/Report.js';
import Proposal from '../models/Proposal.js';
import storageService from '../services/storageService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Helper: Generate PDF from Plate.js content (mocked)
 */
const generatePDFFromContent = (content, metadata) => {
  // In production, use a proper PDF generation library
  const pdfContent = `
REVIEW REPORT
=============

Report by: ${metadata.authorName}
Proposal: ${metadata.proposalCode}
Date: ${new Date().toISOString()}

${JSON.stringify(content, null, 2)}
`;

  return Buffer.from(pdfContent, 'utf-8');
};

/**
 * @route   GET /api/proposals/:proposalId/reports
 * @desc    Get all reports for a proposal
 * @access  Private
 */
export const getReports = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const reports = await Report.find({ proposalId })
    .sort({ createdAt: -1 })
    .populate('author', 'fullName email roles designation organisationName')
    .select('-content') // Exclude full content in list view
    .lean();

  res.json({
    success: true,
    data: reports
  });
});

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get specific report with full content
 * @access  Private
 */
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate('author', 'fullName email roles designation organisationName')
    .populate('proposalId', 'proposalCode title');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  res.json({
    success: true,
    data: report
  });
});

/**
 * @route   POST /api/proposals/:proposalId/reports
 * @desc    Create a new report
 * @access  Private (Committee/Reviewer)
 */
export const createReport = asyncHandler(async (req, res) => {
  const { title, content, reportType } = req.body;

  const proposal = await Proposal.findById(req.params.proposalId).populate('createdBy', 'fullName email');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check permission - must be reviewer or committee member
  const isReviewer = req.user.roles.includes('EXPERT_REVIEWER');
  const isCommittee = req.user.roles.some(role => 
    ['CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role)
  );
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');

  if (!isReviewer && !isCommittee && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only reviewers and committee members can create reports'
    });
  }

  // Create report
  const report = await Report.create({
    proposalId: proposal._id,
    author: req.user._id,
    title,
    content,
    reportType: reportType || 'OTHER',
    status: 'DRAFT'
  });

  await report.populate('author', 'fullName email roles');

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: report
  });
});

/**
 * @route   PUT /api/reports/:reportId
 * @desc    Update report
 * @access  Private (Author only)
 */
export const updateReport = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  const report = await Report.findById(req.params.reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Only author can update
  if (report.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only report author can update it'
    });
  }

  // Can only update drafts
  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update submitted reports'
    });
  }

  if (title) report.title = title;
  if (content) report.content = content;

  await report.save();

  res.json({
    success: true,
    message: 'Report updated successfully',
    data: report
  });
});

/**
 * @route   POST /api/reports/:reportId/submit
 * @desc    Submit report (generate PDF and finalize)
 * @access  Private (Author only)
 */
export const submitReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate('author', 'fullName email')
    .populate('proposalId', 'proposalCode');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Only author can submit
  if (report.author._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only report author can submit it'
    });
  }

  if (report.status === 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      message: 'Report is already submitted'
    });
  }

  // Generate PDF
  const pdfBuffer = generatePDFFromContent(report.content, {
    authorName: report.author.fullName,
    proposalCode: report.proposalId.proposalCode
  });

  // Upload to S3
  const uploadResult = await storageService.uploadReviewerReport(
    pdfBuffer,
    report.proposalId.proposalCode,
    report.author._id.toString()
  );

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload report PDF',
      error: uploadResult.error
    });
  }

  report.pdfUrl = uploadResult.url;
  report.status = 'SUBMITTED';
  await report.save();

  // Log activity
  await activityLogger.log({
    user: req.user._id,
    action: 'REPORT_SUBMITTED',
    proposalId: report.proposalId._id,
    details: { 
      reportId: report._id,
      reportType: report.reportType
    },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Report submitted successfully',
    data: report
  });
});

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete report
 * @access  Private (Author or Admin)
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  // Only author or admin can delete
  const isAuthor = report.author.toString() === req.user._id.toString();
  const isAdmin = req.user.roles.includes('SUPER_ADMIN');

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this report'
    });
  }

  await report.deleteOne();

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});
