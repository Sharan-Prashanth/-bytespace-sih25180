import axios from 'axios';
import FormData from 'form-data';
import storageService from './storageService.js';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

class AIValidationService {
  /**
   * Trigger AI validation for Form I
   * Calls Python backend validation endpoint
   * @param {Object} proposal - The proposal document
   * @returns {Promise<Object>} - Validation result JSON
   */
  async validateFormI(proposal) {
    try {
      // Check if Form I PDF exists in supporting docs (uploaded PDF)
      const formIPdf = proposal.supportingDocs?.find(doc => doc.formName === 'formIPdf');
      
      if (formIPdf && formIPdf.fileUrl) {
        // Use uploaded PDF
        const pdfBuffer = await this.downloadPdfFromUrl(formIPdf.fileUrl);

        // Create form data for Python backend
        const formData = new FormData();
        formData.append('file', pdfBuffer, {
          filename: formIPdf.fileName || 'form-i.pdf',
          contentType: 'application/pdf'
        });

        // Call Python AI validation endpoint
        const response = await axios.post(
          `${AI_BACKEND_URL}/validation/validate-form1`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            },
            timeout: 120000, // 2 minutes timeout
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        return response.data;
      }
      
      // If no PDF uploaded, use Form I editor content
      if (!proposal.forms || !proposal.forms.formi || !proposal.forms.formi.content) {
        throw new Error('Form I content not found in proposal');
      }

      // Convert Plate.js editor content to plain text for validation
      const formIContent = this.extractTextFromPlateContent(proposal.forms.formi.content);
      
      if (!formIContent || formIContent.trim().length === 0) {
        throw new Error('Form I content is empty');
      }

      // Create a text file with Form I content
      const textBuffer = Buffer.from(formIContent, 'utf-8');
      const formData = new FormData();
      formData.append('file', textBuffer, {
        filename: 'form-i.txt',
        contentType: 'text/plain'
      });

      // Call Python AI validation endpoint
      const response = await axios.post(
        `${AI_BACKEND_URL}/validation/validate-form1`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 120000, // 2 minutes timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Validation error:', error.message);
      throw new Error(`Failed to validate Form I: ${error.message}`);
    }
  }

  /**
   * Extract plain text from Plate.js content structure
   * @param {Array} content - Plate.js content array
   * @returns {string} - Plain text content
   */
  extractTextFromPlateContent(content) {
    if (!Array.isArray(content)) return '';
    
    let text = '';
    
    const extractFromNode = (node) => {
      if (node.text) {
        text += node.text;
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => extractFromNode(child));
      }
      
      // Add newline after block elements
      if (node.type && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(node.type)) {
        text += '\n';
      }
    };
    
    content.forEach(node => extractFromNode(node));
    
    return text.trim();
  }

  /**
   * Trigger full AI analysis/evaluation for Form I
   * Calls Python backend full-analysis endpoint
   * @param {Object} proposal - The proposal document
   * @returns {Promise<Object>} - Evaluation result JSON
   */
  async evaluateFormI(proposal) {
    try {
      // Check if Form I PDF exists in supporting docs (uploaded PDF)
      const formIPdf = proposal.supportingDocs?.find(doc => doc.formName === 'formIPdf');
      
      if (formIPdf && formIPdf.fileUrl) {
        // Use uploaded PDF
        const pdfBuffer = await this.downloadPdfFromUrl(formIPdf.fileUrl);

        // Create form data for Python backend
        const formData = new FormData();
        formData.append('pdf', pdfBuffer, {
          filename: formIPdf.fileName || 'form-i.pdf',
          contentType: 'application/pdf'
        });

        // Call Python AI full-analysis endpoint
        const response = await axios.post(
          `${AI_BACKEND_URL}/full-analysis`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            },
            timeout: 300000, // 5 minutes timeout for full analysis
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        return response.data;
      }
      
      // If no PDF uploaded, use Form I editor content
      if (!proposal.forms || !proposal.forms.formi || !proposal.forms.formi.content) {
        throw new Error('Form I content not found in proposal');
      }

      // Convert Plate.js editor content to plain text
      const formIContent = this.extractTextFromPlateContent(proposal.forms.formi.content);
      
      if (!formIContent || formIContent.trim().length === 0) {
        throw new Error('Form I content is empty');
      }

      // Create a text file with Form I content
      const textBuffer = Buffer.from(formIContent, 'utf-8');
      const formData = new FormData();
      formData.append('pdf', textBuffer, {
        filename: 'form-i.txt',
        contentType: 'text/plain'
      });

      // Call Python AI full-analysis endpoint
      const response = await axios.post(
        `${AI_BACKEND_URL}/full-analysis`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 300000, // 5 minutes timeout for full analysis
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI Evaluation error:', error.message);
      throw new Error(`Failed to evaluate Form I: ${error.message}`);
    }
  }

  /**
   * Download PDF from URL (Supabase or other storage)
   * @param {string} url - The file URL
   * @returns {Promise<Buffer>} - PDF file buffer
   */
  async downloadPdfFromUrl(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000 // 1 minute timeout
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading PDF:', error.message);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }
}

export default new AIValidationService();
