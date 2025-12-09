import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Status display names and descriptions
const STATUS_INFO = {
  'DRAFT': {
    name: 'Draft',
    description: 'Your proposal is saved as a draft and has not been submitted yet.',
    color: '#6B7280'
  },
  'AI_EVALUATION_PENDING': {
    name: 'AI Evaluation Pending',
    description: 'Your proposal has been submitted and is awaiting AI-based evaluation.',
    color: '#3B82F6'
  },
  'AI_EVALUATION_COMPLETE': {
    name: 'AI Evaluation Complete',
    description: 'AI evaluation has been completed. Your proposal is being prepared for CMPDI review.',
    color: '#10B981'
  },
  'CMPDI_REVIEW': {
    name: 'CMPDI Review',
    description: 'Your proposal is currently under review by the Central Mine Planning & Design Institute.',
    color: '#F59E0B'
  },
  'CMPDI_EXPERT_REVIEW': {
    name: 'Expert Review',
    description: 'Your proposal has been assigned to domain experts for detailed technical evaluation.',
    color: '#8B5CF6'
  },
  'CMPDI_ACCEPTED': {
    name: 'CMPDI Accepted',
    description: 'Congratulations! Your proposal has been accepted by CMPDI and forwarded to TSSRC.',
    color: '#10B981'
  },
  'CMPDI_REJECTED': {
    name: 'CMPDI Rejected',
    description: 'Your proposal has not been approved by CMPDI. Please review the feedback and consider resubmission.',
    color: '#EF4444'
  },
  'TSSRC_REVIEW': {
    name: 'TSSRC Review',
    description: 'Your proposal is under review by the Technical Sub-Standing Research Committee.',
    color: '#F59E0B'
  },
  'TSSRC_ACCEPTED': {
    name: 'TSSRC Accepted',
    description: 'Congratulations! Your proposal has been accepted by TSSRC and forwarded to SSRC for final approval.',
    color: '#10B981'
  },
  'TSSRC_REJECTED': {
    name: 'TSSRC Rejected',
    description: 'Your proposal has not been approved by TSSRC. Please review the feedback provided.',
    color: '#EF4444'
  },
  'SSRC_REVIEW': {
    name: 'SSRC Review',
    description: 'Your proposal is under final review by the Standing Scientific Research Committee.',
    color: '#F59E0B'
  },
  'SSRC_ACCEPTED': {
    name: 'SSRC Accepted - Project Approved',
    description: 'Congratulations! Your proposal has received final approval. The project is now marked as ongoing.',
    color: '#10B981'
  },
  'SSRC_REJECTED': {
    name: 'SSRC Rejected',
    description: 'Your proposal has not received final approval from SSRC. Please review the feedback.',
    color: '#EF4444'
  },
  'ONGOING': {
    name: 'Project Ongoing',
    description: 'Your project is now active and in progress. Please submit regular progress reports.',
    color: '#10B981'
  },
  'CLARIFICATION_REQUESTED': {
    name: 'Clarification Requested',
    description: 'Additional information or clarification is required for your proposal. Please respond promptly.',
    color: '#F59E0B'
  }
};

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.sendRealEmails = process.env.SEND_REAL_EMAILS === 'true';
    
    // Verify transporter
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('[EMAIL] Transporter verification failed:', error);
      } else {
        console.log('[EMAIL] Email server is ready to send messages');
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.sendRealEmails) {
        console.log('[EMAIL] Email sending disabled. Would have sent:');
        console.log({ to, subject, preview: text?.substring(0, 100) });
        return { success: true, message: 'Email disabled in config' };
      }

      const mailOptions = {
        from: `"NaCCER Portal" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] Email sent successfully to:', to);
      console.log('[EMAIL] Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EMAIL] Send error:', error);
      return { success: false, error: error.message };
    }
  }
  
  generateStatusEmailTemplate(userName, proposalInfo, oldStatus, newStatus, comments = '') {
    const statusInfo = STATUS_INFO[newStatus] || { name: newStatus, description: '', color: '#6B7280' };
    const isApproved = newStatus.includes('ACCEPTED');
    const isRejected = newStatus.includes('REJECTED');
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposal Status Update</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 8px 0 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 16px;
            color: #000000;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          .status-card {
            background-color: #f8fafc;
            border-left: 4px solid ${statusInfo.color};
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .status-badge {
            display: inline-block;
            background-color: ${statusInfo.color};
            color: #ffffff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .status-description {
            color: #000000;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          .proposal-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .info-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #000000;
            min-width: 140px;
            font-size: 14px;
          }
          .info-value {
            color: #000000;
            font-size: 14px;
            flex: 1;
          }
          .comments-section {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .comments-title {
            font-weight: 600;
            color: #000000;
            font-size: 14px;
            margin-bottom: 12px;
          }
          .comments-text {
            color: #000000;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            margin: 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 24px 0;
            text-align: center;
          }
          .next-steps {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .next-steps-title {
            font-weight: 600;
            color: #000000;
            font-size: 16px;
            margin-bottom: 12px;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #000000;
            font-size: 14px;
            line-height: 1.8;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            color: #000000;
            font-size: 12px;
            line-height: 1.6;
            margin: 8px 0;
          }
          .footer-links {
            margin-top: 16px;
          }
          .footer-link {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 12px;
            font-size: 12px;
          }
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>NaCCER Portal</h1>
            <p>National Centre of Excellence for Climate & Clean Energy Research</p>
          </div>

          <div class="content">
            <div class="greeting">
              Dear ${userName},
            </div>

            <p style="color: #000000; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              We are writing to inform you about an important update regarding your research proposal submission.
            </p>

            <div class="status-card">
              <div class="status-badge">${statusInfo.name}</div>
              <p class="status-description">${statusInfo.description}</p>
            </div>

            <div class="proposal-info">
              <div class="info-row">
                <div class="info-label">Proposal Code:</div>
                <div class="info-value"><strong>${proposalInfo.proposalCode}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Proposal Title:</div>
                <div class="info-value">${proposalInfo.title || 'N/A'}</div>
              </div>
              ${proposalInfo.projectArea ? `
              <div class="info-row">
                <div class="info-label">Project Area:</div>
                <div class="info-value">${proposalInfo.projectArea}</div>
              </div>
              ` : ''}
              <div class="info-row">
                <div class="info-label">Previous Status:</div>
                <div class="info-value">${STATUS_INFO[oldStatus]?.name || oldStatus}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Current Status:</div>
                <div class="info-value"><strong>${statusInfo.name}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Updated On:</div>
                <div class="info-value">${new Date().toLocaleString('en-US', { 
                  dateStyle: 'long', 
                  timeStyle: 'short',
                  timeZone: 'Asia/Kolkata'
                })}</div>
              </div>
            </div>

            ${comments ? `
            <div class="comments-section">
              <div class="comments-title">Additional Comments:</div>
              <p class="comments-text">${comments}</p>
            </div>
            ` : ''}

            ${isApproved ? `
            <div class="next-steps">
              <div class="next-steps-title">Next Steps:</div>
              <ul>
                <li>Your proposal has been approved and is progressing through the review workflow</li>
                <li>You will receive further updates as your proposal advances</li>
                <li>Monitor your dashboard for any action items or clarification requests</li>
                ${newStatus === 'SSRC_ACCEPTED' ? '<li>Begin project implementation as per your approved timeline</li>' : ''}
              </ul>
            </div>
            ` : isRejected ? `
            <div class="next-steps">
              <div class="next-steps-title">Next Steps:</div>
              <ul>
                <li>Review the feedback and comments provided by the review committee</li>
                <li>Address the identified concerns and make necessary improvements</li>
                <li>Consider resubmitting your proposal after incorporating the feedback</li>
                <li>Contact the support team if you need clarification on the feedback</li>
              </ul>
            </div>
            ` : newStatus === 'CLARIFICATION_REQUESTED' ? `
            <div class="next-steps">
              <div class="next-steps-title">Action Required:</div>
              <ul>
                <li>Review the clarification requests carefully</li>
                <li>Provide detailed responses to all queries</li>
                <li>Upload any additional documents if requested</li>
                <li>Submit your response promptly to avoid delays</li>
              </ul>
            </div>
            ` : `
            <div class="next-steps">
              <div class="next-steps-title">What Happens Next:</div>
              <ul>
                <li>Your proposal is being reviewed by the designated committee</li>
                <li>The review process typically takes 7-14 working days</li>
                <li>You will be notified of any updates or requests for clarification</li>
                <li>Monitor your dashboard regularly for any action items</li>
              </ul>
            </div>
            `}

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" class="cta-button">
                View Proposal Details
              </a>
            </center>

            <div class="divider"></div>

            <p style="color: #000000; font-size: 14px; line-height: 1.6; margin-top: 24px;">
              If you have any questions or concerns regarding this update, please do not hesitate to contact our support team.
            </p>

            <p style="color: #000000; font-size: 14px; line-height: 1.6; margin-top: 16px;">
              Best regards,<br>
              <strong>NaCCER Portal Team</strong><br>
              National Centre of Excellence for Climate & Clean Energy Research
            </p>
          </div>

          <div class="footer">
            <p class="footer-text">
              This is an automated notification from the NaCCER Portal.<br>
              Please do not reply to this email.
            </p>
            <div class="footer-links">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" class="footer-link">Dashboard</a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/help" class="footer-link">Help Center</a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/contact" class="footer-link">Contact Support</a>
            </div>
            <p class="footer-text" style="margin-top: 16px;">
              &copy; ${new Date().getFullYear()} NaCCER Portal. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  async sendStatusUpdateEmail(userEmail, userName, proposalInfo, oldStatus, newStatus, comments = '') {
    try {
      if (!userEmail || !userName || !proposalInfo || !proposalInfo.proposalCode) {
        console.error('[EMAIL] Missing required fields for status update email');
        return { success: false, error: 'Missing required fields' };
      }

      const statusInfo = STATUS_INFO[newStatus] || { name: newStatus };
      const htmlContent = this.generateStatusEmailTemplate(userName, proposalInfo, oldStatus, newStatus, comments);

      const result = await this.sendEmail({
        to: userEmail,
        subject: `Proposal Status Update: ${proposalInfo.proposalCode} - ${statusInfo.name}`,
        html: htmlContent,
        text: `Your proposal ${proposalInfo.proposalCode} status has been updated from ${oldStatus} to ${newStatus}`
      });

      if (result.success) {
        console.log('[EMAIL] Status update sent:', proposalInfo.proposalCode, oldStatus, '->', newStatus);
      }

      return result;
    } catch (error) {
      console.error('[EMAIL] Failed to send status update:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, fullName, role) {
    const subject = 'Welcome to NaCCER Research Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to NaCCER Research Portal</h2>
        <p>Dear ${fullName},</p>
        <p>Your account has been successfully created with the role: <strong>${role}</strong></p>
        <p>You can now login and start using the portal.</p>
        <p>If you have any questions, please contact support.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `Welcome to NaCCER Research Portal. Your account has been created as ${role}.`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendProposalSubmittedEmail(email, fullName, proposalCode, proposalTitle) {
    const subject = `Proposal Submitted Successfully - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Proposal Submitted Successfully</h2>
        <p>Dear ${fullName},</p>
        <p>Your research proposal has been successfully submitted for review.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Title:</strong> ${proposalTitle}</p>
        </div>
        <p>Your proposal is currently under AI evaluation and will be reviewed by the CMPDI committee.</p>
        <p>You will receive email notifications as your proposal progresses through the review stages.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `Your proposal ${proposalCode} - "${proposalTitle}" has been submitted successfully.`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendStatusChangeEmail(email, fullName, proposalCode, oldStatus, newStatus) {
    const subject = `Proposal Status Updated - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Proposal Status Updated</h2>
        <p>Dear ${fullName},</p>
        <p>The status of your proposal has been updated.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> ${newStatus}</p>
        </div>
        <p>Login to the portal to view more details and take any required actions.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `Your proposal ${proposalCode} status changed from ${oldStatus} to ${newStatus}.`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendCollaborationInviteEmail(email, fullName, invitedBy, proposalCode, proposalTitle) {
    const subject = `Collaboration Invite - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Collaboration Invitation</h2>
        <p>Dear ${fullName},</p>
        <p>You have been invited to collaborate on a research proposal.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Invited by:</strong> ${invitedBy}</p>
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Title:</strong> ${proposalTitle}</p>
        </div>
        <p>Login to the portal to view the proposal and start collaborating.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `You've been invited by ${invitedBy} to collaborate on proposal ${proposalCode}.`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendNewCommentEmail(email, fullName, proposalCode, commenterName, commentPreview) {
    const subject = `New Comment on Proposal - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Comment on Your Proposal</h2>
        <p>Dear ${fullName},</p>
        <p><strong>${commenterName}</strong> has added a comment on your proposal.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Comment:</strong> ${commentPreview}</p>
        </div>
        <p>Login to the portal to view the full comment and respond.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `${commenterName} commented on your proposal ${proposalCode}: ${commentPreview}`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendReviewerAssignmentEmail(email, fullName, proposalCode, proposalTitle, dueDate) {
    const subject = `Review Assignment - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Review Assignment</h2>
        <p>Dear ${fullName},</p>
        <p>You have been assigned to review a research proposal.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Title:</strong> ${proposalTitle}</p>
          ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
        </div>
        <p>Login to the portal to access the proposal and submit your review.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `You've been assigned to review proposal ${proposalCode} - "${proposalTitle}"`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendClarificationRequestEmail(email, fullName, proposalCode, requesterName, clarificationText) {
    const subject = `Clarification Requested - ${proposalCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Clarification Requested</h2>
        <p>Dear ${fullName},</p>
        <p><strong>${requesterName}</strong> has requested clarification on your proposal.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p><strong>Request:</strong> ${clarificationText}</p>
        </div>
        <p>Please login to the portal and provide the requested information.</p>
        <br>
        <p>Best regards,<br>NaCCER Team</p>
      </div>
    `;
    const text = `${requesterName} requested clarification on proposal ${proposalCode}: ${clarificationText}`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async sendClarificationReportEmail(email, fullName, proposalCode, reportTitle, committeeType, proposalId) {
    const subject = `Clarification Report Received - ${proposalCode}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackUrl = `${frontendUrl}/proposal/track/${proposalId}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Clarification Report Received</h2>
        <p>Dear ${fullName},</p>
        <p>The <strong>${committeeType}</strong> committee has submitted a clarification report for your proposal.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 5px 0;"><strong>Proposal ID:</strong> ${proposalCode}</p>
          <p style="margin: 5px 0;"><strong>Report Title:</strong> ${reportTitle}</p>
          <p style="margin: 5px 0;"><strong>Committee:</strong> ${committeeType}</p>
        </div>
        <p>Please login to the portal to view the full clarification report and take necessary actions.</p>
        <a href="${trackUrl}" style="display: inline-block; background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Clarification Report</a>
        <br>
        <p style="margin-top: 20px;">Best regards,<br><strong>NaCCER Team</strong></p>
      </div>
    `;
    const text = `${committeeType} committee has submitted a clarification report for your proposal ${proposalCode}: ${reportTitle}. View it at: ${trackUrl}`;
    
    return await this.sendEmail({ to: email, subject, html, text });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connected' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();
