import Proposal from '../models/Proposal.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper: Find proposal by ID or proposalCode
 */
const findProposal = async (proposalId) => {
  if (mongoose.Types.ObjectId.isValid(proposalId) && proposalId.length === 24) {
    return await Proposal.findById(proposalId);
  } else {
    return await Proposal.findOne({ proposalCode: proposalId });
  }
};

/**
 * @route   GET /api/proposals/:proposalId/ai-report
 * @desc    Fetch AI report JSON data for a proposal
 * @access  Private
 */
export const getAIReportData = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Try to fetch from the Python API first (latest analysis)
  try {
    const pythonApiUrl = process.env.AI_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${pythonApiUrl}/full-analysis/latest`, {
      timeout: 5000
    });
    
    if (response.status === 200 && response.data) {
      return res.json({
        success: true,
        data: response.data,
        source: 'python_api'
      });
    }
  } catch (error) {
    console.log('Failed to fetch from Python API, trying local file:', error.message);
  }

  // Fallback: Try to read from generated-reports directory
  try {
    const reportPath = path.join(__dirname, '../../Model/data/latest.json');
    const reportData = await fs.readFile(reportPath, 'utf-8');
    const jsonData = JSON.parse(reportData);
    
    return res.json({
      success: true,
      data: jsonData,
      source: 'local_file'
    });
  } catch (error) {
    console.log('Failed to read local report file:', error.message);
  }

  // If no report found
  return res.status(404).json({
    success: false,
    message: 'No AI report available for this proposal. Please generate an analysis first.'
  });
});

/**
 * @route   GET /api/proposals/:proposalId/ai-report/html
 * @desc    Render AI report as HTML using test.html template
 * @access  Private
 */
export const getAIReportHTML = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  try {
    // Read the template file - template folder is at the root level
    const templatePath = path.join(__dirname, '../..', 'template', 'test.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    
    // Fetch AI report data
    let reportData = null;
    
    // Try Python API first
    try {
      const pythonApiUrl = process.env.AI_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${pythonApiUrl}/full-analysis/latest`, {
        timeout: 5000
      });
      
      if (response.status === 200 && response.data) {
        reportData = response.data;
      }
    } catch (error) {
      console.log('Failed to fetch from Python API, trying local file');
    }

    // Fallback to local file
    if (!reportData) {
      try {
        const reportPath = path.join(__dirname, '../../Model/data/latest.json');
        const reportContent = await fs.readFile(reportPath, 'utf-8');
        reportData = JSON.parse(reportContent);
      } catch (error) {
        console.log('Failed to read local report file');
      }
    }

    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: 'No AI report data available'
      });
    }

    // Fix asset paths to use absolute URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    htmlTemplate = htmlTemplate.replace(/\.\/assets\//g, `${baseUrl}/template/assets/`);
    htmlTemplate = htmlTemplate.replace(/src="assets\//g, `src="${baseUrl}/template/assets/`);
    htmlTemplate = htmlTemplate.replace(/src="\.\.\/assets\//g, `src="${baseUrl}/template/assets/`);
    
    // Inject the JSON data into the template
    // Replace the auto-fetch mechanism with pre-populated data
    const jsonDataScript = `
      <script>
        // Pre-populated report data
        window.AI_REPORT_DATA = ${JSON.stringify(reportData)};
        
        // Override the fetch to use pre-populated data
        document.addEventListener('DOMContentLoaded', function() {
          try {
            populateReport(window.AI_REPORT_DATA);
            const status = document.getElementById('json-status');
            if (status) {
              status.textContent = '✅ Report rendered successfully';
            }
            // Hide the JSON UI controls
            const jsonUI = document.getElementById('json-ui');
            if (jsonUI) {
              jsonUI.style.display = 'none';
            }
          } catch (error) {
            console.error('Failed to render report:', error);
            const status = document.getElementById('json-status');
            if (status) {
              status.textContent = '❌ Failed to render report: ' + error.message;
            }
          }
        });
      </script>
    `;

    // Insert the script before the closing </body> tag
    htmlTemplate = htmlTemplate.replace('</body>', `${jsonDataScript}</body>`);

    // Set proper content type and send HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlTemplate);

  } catch (error) {
    console.error('Error generating AI report HTML:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI report HTML'
    });
  }
});

/**
 * @route   POST /api/proposals/:proposalId/generate-ai-report
 * @desc    Trigger AI report generation for a proposal
 * @access  Private (CMPDI/Admin only)
 */
export const generateAIReport = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  
  const proposal = await findProposal(proposalId);
  
  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found'
    });
  }

  // Check if user has permission (CMPDI or Admin)
  const user = req.user;
  const hasPermission = user.roles.includes('SUPER_ADMIN') || user.roles.includes('CMPDI_MEMBER');
  
  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to generate AI reports'
    });
  }

  try {
    // TODO: Trigger AI report generation
    // This would involve uploading the Form I PDF to the Python API
    // For now, return a placeholder response
    
    res.json({
      success: true,
      message: 'AI report generation triggered. This feature is under development.',
      data: {
        proposalId: proposal._id,
        proposalCode: proposal.proposalCode,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error triggering AI report generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger AI report generation'
    });
  }
});
