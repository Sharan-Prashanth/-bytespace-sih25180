import Report from '../models/Report.js';
import Proposal from '../models/Proposal.js';
import storageService from '../services/storageService.js';
import activityLogger from '../utils/activityLogger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { JSDOM } from 'jsdom';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
import zlib from 'zlib';

/**
 * Helper: Convert HTML to plain text for PDF
 */
const htmlToText = (html) => {
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || '';
};

/**
 * Helper: Parse HTML and extract structured content for PDF
 */
const parseHtmlForPdf = (html) => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const elements = [];

  const processNode = (node) => {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent.trim();
      if (text) {
        return [{ type: 'text', content: text }];
      }
      return [];
    }

    if (node.nodeType !== 1) return [];

    const tagName = node.tagName.toLowerCase();
    const items = [];

    switch (tagName) {
      case 'h1':
        items.push({ type: 'heading1', content: node.textContent.trim() });
        break;
      case 'h2':
        items.push({ type: 'heading2', content: node.textContent.trim() });
        break;
      case 'h3':
        items.push({ type: 'heading3', content: node.textContent.trim() });
        break;
      case 'p':
        items.push({ type: 'paragraph', content: node.textContent.trim() });
        break;
      case 'ul':
        const ulItems = [];
        node.querySelectorAll('li').forEach(li => {
          ulItems.push(li.textContent.trim());
        });
        items.push({ type: 'bulletList', items: ulItems });
        break;
      case 'ol':
        const olItems = [];
        node.querySelectorAll('li').forEach(li => {
          olItems.push(li.textContent.trim());
        });
        items.push({ type: 'numberedList', items: olItems });
        break;
      case 'blockquote':
        items.push({ type: 'quote', content: node.textContent.trim() });
        break;
      default:
        // Process children
        node.childNodes.forEach(child => {
          items.push(...processNode(child));
        });
    }

    return items;
  };

  doc.body.childNodes.forEach(node => {
    elements.push(...processNode(node));
  });

  return elements;
};

/**
 * Helper: Generate PDF from HTML content using PDFKit
 */
const generatePDFFromContent = async (htmlContent, textContent, metadata) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        info: {
          Title: metadata.title || 'Review Report',
          Author: metadata.authorName,
          Subject: `Report for ${metadata.proposalCode}`,
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('REVIEW REPORT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'center' });
      
      // Divider
      doc.moveDown(1);
      doc.strokeColor('#cccccc').lineWidth(1);
      doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
      doc.moveDown(1);

      // Metadata section
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text('Report Details', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica');
      doc.text(`Proposal Code: ${metadata.proposalCode}`, { continued: false });
      doc.text(`Report Title: ${metadata.title}`, { continued: false });
      doc.text(`Report Type: ${metadata.reportType?.replace(/_/g, ' ') || 'Committee Review'}`, { continued: false });
      doc.text(`Author: ${metadata.authorName}`, { continued: false });
      if (metadata.decision) {
        doc.text(`Decision: ${metadata.decision.replace(/_/g, ' ')}`, { continued: false });
      }
      
      // Divider
      doc.moveDown(1);
      doc.strokeColor('#cccccc').lineWidth(1);
      doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
      doc.moveDown(1);

      // Content section
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Report Content', { underline: true });
      doc.moveDown(0.5);

      // Parse and render HTML content
      if (htmlContent) {
        const elements = parseHtmlForPdf(htmlContent);
        
        elements.forEach(element => {
          switch (element.type) {
            case 'heading1':
              doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
              doc.moveDown(0.5);
              doc.text(element.content);
              doc.moveDown(0.5);
              break;
            case 'heading2':
              doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000');
              doc.moveDown(0.3);
              doc.text(element.content);
              doc.moveDown(0.3);
              break;
            case 'heading3':
              doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
              doc.moveDown(0.2);
              doc.text(element.content);
              doc.moveDown(0.2);
              break;
            case 'paragraph':
            case 'text':
              doc.fontSize(11).font('Helvetica').fillColor('#333333');
              if (element.content) {
                doc.text(element.content, { align: 'justify' });
                doc.moveDown(0.5);
              }
              break;
            case 'bulletList':
              doc.fontSize(11).font('Helvetica').fillColor('#333333');
              element.items.forEach(item => {
                if (item) {
                  doc.text(`  * ${item}`, { indent: 20 });
                }
              });
              doc.moveDown(0.5);
              break;
            case 'numberedList':
              doc.fontSize(11).font('Helvetica').fillColor('#333333');
              element.items.forEach((item, index) => {
                if (item) {
                  doc.text(`  ${index + 1}. ${item}`, { indent: 20 });
                }
              });
              doc.moveDown(0.5);
              break;
            case 'quote':
              doc.fontSize(11).font('Helvetica-Oblique').fillColor('#555555');
              doc.text(`"${element.content}"`, { indent: 20 });
              doc.moveDown(0.5);
              break;
          }
        });
      } else if (textContent) {
        // Fallback to plain text
        doc.fontSize(11).font('Helvetica').fillColor('#333333');
        doc.text(textContent, { align: 'justify' });
      }

      // Footer
      doc.moveDown(2);
      doc.strokeColor('#cccccc').lineWidth(0.5);
      doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#999999');
      doc.text('This is an official document generated by NaCCER Portal. Unauthorized modification is prohibited.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Helper: Compress PDF buffer using gzip
 */
const compressPDF = (pdfBuffer) => {
  return new Promise((resolve, reject) => {
    zlib.gzip(pdfBuffer, { level: 9 }, (err, compressedBuffer) => {
      if (err) reject(err);
      else resolve(compressedBuffer);
    });
  });
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
 * @desc    Create a new report with HTML content
 * @access  Private (Committee/Reviewer)
 */
export const createReport = asyncHandler(async (req, res) => {
  const { title, content, htmlContent, textContent, reportType, decision, wordCount, characterCount } = req.body;

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

  // Create report with both plain content and HTML content
  const report = await Report.create({
    proposalId: proposal._id,
    author: req.user._id,
    title,
    content: htmlContent || content, // Store HTML content as primary
    htmlContent: htmlContent || content,
    textContent: textContent || '',
    reportType: reportType || 'OTHER',
    decision: decision || null,
    wordCount: wordCount || 0,
    characterCount: characterCount || 0,
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
 * @desc    Submit report (generate PDF, compress, and upload to S3)
 * @access  Private (Author only)
 */
export const submitReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate('author', 'fullName email')
    .populate('proposalId', 'proposalCode title');

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

  try {
    // Generate PDF from content
    const pdfBuffer = await generatePDFFromContent(
      report.htmlContent || report.content,
      report.textContent,
      {
        title: report.title,
        authorName: report.author.fullName,
        proposalCode: report.proposalId.proposalCode,
        reportType: report.reportType,
        decision: report.decision
      }
    );

    console.log(`PDF generated: ${pdfBuffer.length} bytes`);

    // Compress PDF (optional - only if significant size reduction)
    let uploadBuffer = pdfBuffer;
    let isCompressed = false;
    
    // Only compress if PDF is larger than 100KB
    if (pdfBuffer.length > 100 * 1024) {
      const compressedBuffer = await compressPDF(pdfBuffer);
      // Only use compressed if it's significantly smaller
      if (compressedBuffer.length < pdfBuffer.length * 0.9) {
        uploadBuffer = compressedBuffer;
        isCompressed = true;
        console.log(`PDF compressed: ${pdfBuffer.length} -> ${compressedBuffer.length} bytes`);
      }
    }

    // Upload to S3/Supabase Storage
    const uploadResult = await storageService.uploadReviewerReport(
      uploadBuffer,
      report.proposalId.proposalCode,
      report.author._id.toString(),
      isCompressed ? 'application/gzip' : 'application/pdf'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload report PDF',
        error: uploadResult.error
      });
    }

    // Update report with PDF URL and status
    report.pdfUrl = uploadResult.url;
    report.pdfSize = uploadBuffer.length;
    report.isCompressed = isCompressed;
    report.status = 'SUBMITTED';
    report.submittedAt = new Date();
    await report.save();

    // Log activity
    await activityLogger.log({
      user: req.user._id,
      action: 'REPORT_SUBMITTED',
      proposalId: report.proposalId._id,
      details: { 
        reportId: report._id,
        reportType: report.reportType,
        pdfSize: uploadBuffer.length
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Report submitted successfully. PDF has been generated and stored.',
      data: report
    });
  } catch (error) {
    console.error('Error generating/uploading PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate report PDF',
      error: error.message
    });
  }
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
