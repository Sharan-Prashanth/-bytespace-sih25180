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
   * Normalize table structure to ensure all cells have proper borders
   * Recursively processes all nodes including deeply nested structures
   * @param {Array|Object} content - Slate.js content array or node
   * @returns {Array|Object} - Normalized content
   */
  normalizeTableStructure(content) {
    // Handle array of nodes
    if (Array.isArray(content)) {
      return content.map(node => this.normalizeTableStructure(node));
    }
    
    // Handle non-object nodes (text nodes, null, etc)
    if (!content || typeof content !== 'object') {
      return content;
    }
    
    // Clone the node to avoid mutation
    const normalizedNode = { ...content };
    
    // If it's a table cell without borders, add them
    if ((normalizedNode.type === 'td' || normalizedNode.type === 'th')) {
      if (!normalizedNode.borders) {
        normalizedNode.borders = {
          top: { size: 1, style: 'solid', color: '#e5e7eb' },
          right: { size: 1, style: 'solid', color: '#e5e7eb' },
          bottom: { size: 1, style: 'solid', color: '#e5e7eb' },
          left: { size: 1, style: 'solid', color: '#e5e7eb' }
        };
      } else {
        // Ensure borders object has all required properties
        normalizedNode.borders = {
          top: normalizedNode.borders.top || { size: 1, style: 'solid', color: '#e5e7eb' },
          right: normalizedNode.borders.right || { size: 1, style: 'solid', color: '#e5e7eb' },
          bottom: normalizedNode.borders.bottom || { size: 1, style: 'solid', color: '#e5e7eb' },
          left: normalizedNode.borders.left || { size: 1, style: 'solid', color: '#e5e7eb' }
        };
      }
    }
    
    // Recursively process children
    if (normalizedNode.children && Array.isArray(normalizedNode.children)) {
      normalizedNode.children = normalizedNode.children.map(child => 
        this.normalizeTableStructure(child)
      );
    }
    
    return normalizedNode;
  }

  /**
   * Extract Form I content from PDF using AI backend
   * @param {string} fileUrl - URL of the uploaded PDF in Supabase Storage
   * @param {string} fileName - Original filename
   * @returns {Object} - Extracted content in Slate.js format
   */
  async extractFormI(fileUrl, fileName) {
    try {
      console.log(`[SERVICE] Starting extraction for: ${fileName}`);
      
      // Download file from Supabase Storage
      console.log('[SERVICE] Downloading file from Supabase Storage...');
      const downloadStartTime = Date.now();
      const fileBuffer = await this.downloadFileFromStorage(fileUrl);
      console.log(`[SERVICE] File downloaded in ${Date.now() - downloadStartTime}ms, size: ${fileBuffer.length} bytes`);

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/pdf'
      });

      // Call AI backend
      console.log(`[SERVICE] Sending file to AI backend: ${this.aiBackendUrl}/process-file`);
      const aiStartTime = Date.now();
      
      const response = await axios.post(
        `${this.aiBackendUrl}/process-file`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 1200000, // 20 minutes timeout for PDF processing
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      const aiDuration = Date.now() - aiStartTime;
      console.log(`[SERVICE] AI backend responded in ${aiDuration}ms (${(aiDuration/1000).toFixed(2)}s)`);
      console.log(`[SERVICE] Response status: ${response.status}`);
      console.log(`[SERVICE] Response has data: ${!!response.data}`);

      if (!response.data) {
        console.error('[SERVICE] ERROR: Empty response from AI backend');
        throw new Error('Empty response from AI backend');
      }

      // Log response structure
      console.log('[SERVICE] Response data type:', typeof response.data);
      console.log('[SERVICE] Response is array:', Array.isArray(response.data));
      
      if (Array.isArray(response.data)) {
        console.log(`[SERVICE] Response contains ${response.data.length} items`);
        if (response.data.length > 0) {
          console.log('[SERVICE] First item keys:', Object.keys(response.data[0] || {}));
          console.log('[SERVICE] First item type:', response.data[0]?.type);
        }
      } else if (typeof response.data === 'object') {
        console.log('[SERVICE] Response object keys:', Object.keys(response.data));
      }
      
      const dataPreview = JSON.stringify(response.data).substring(0, 200);
      console.log('[SERVICE] Response data preview:', dataPreview, '...');

      // Normalize table structures to ensure all cells have borders
      console.log('[SERVICE] Normalizing table structures...');
      const normalizedContent = this.normalizeTableStructure(response.data);
      console.log('[SERVICE] Table normalization complete');

      console.log('[SERVICE] Form I extraction successful');
      
      // Return the normalized content with proper table borders
      return {
        success: true,
        content: normalizedContent
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
