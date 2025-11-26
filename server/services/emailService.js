import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.sendRealEmails = process.env.SEND_REAL_EMAILS === 'true';
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.sendRealEmails) {
        console.log('Email sending disabled. Would have sent:');
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
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
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
