import axios from 'axios';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';

class FormExtractionService {
  constructor() {
    this.aiBackendUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000';
    this._supabase = null;
  }

  // Lazy initialization of Supabase client
  get supabase() {
    if (!this._supabase) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in environment variables');
      }
      
      this._supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this._supabase;
  }

  /**
   * Download file from Supabase Storage as buffer
   */
  async downloadFileFromStorage(fileUrl) {
    try {
      // Extract bucket and path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/storage/v1/object/public/');
      
      if (pathParts.length < 2) {
        throw new Error('Invalid Supabase storage URL');
      }

      const [bucket, ...filePath] = pathParts[1].split('/');
      const fullPath = filePath.join('/');

      // Download file from Supabase
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(fullPath);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  }

  /**
   * Extract Form I content from PDF using AI backend
   * @param {string} fileUrl - URL of the uploaded PDF in Supabase Storage
   * @param {string} fileName - Original filename
   * @returns {Object} - Extracted content in Slate.js format
   */
  async extractFormI(fileUrl, fileName) {
    try {
      console.log(`Extracting Form I from: ${fileName}`);
      
      // Download file from Supabase Storage
      const fileBuffer = await this.downloadFileFromStorage(fileUrl);

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/pdf'
      });

      // Call AI backend
      const response = await axios.post(
        `${this.aiBackendUrl}/process-file`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 120000, // 2 minutes timeout for PDF processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (!response.data) {
        throw new Error('Empty response from AI backend');
      }

      console.log('Form I extraction successful');
      
      // The AI backend returns the structured JSON in Slate.js format
      return {
        success: true,
        content: response.data
      };

    } catch (error) {
      console.error('Form I extraction error:', error.message);
      
      // Provide detailed error information
      if (error.response) {
        return {
          success: false,
          error: `AI backend error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
        };
      } else if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'AI backend is not running. Please start the AI backend server at http://localhost:8000'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown extraction error'
        };
      }
    }
  }

  /**
   * Check if AI backend is available
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.aiBackendUrl}/docs`, {
        timeout: 5000
      });
      return {
        success: true,
        status: 'AI backend is running'
      };
    } catch (error) {
      return {
        success: false,
        status: 'AI backend is not available'
      };
    }
  }
}

export default new FormExtractionService();
