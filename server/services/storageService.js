import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class StorageService {
  constructor() {
    this._supabase = null;
    
    this.buckets = {
      images: 'images',
      proposalFiles: 'proposal-files'
    };
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
   * Upload image file (signatures, seals, embedded images)
   */
  async uploadImage(file, folder = 'misc') {
    try {
      const fileExt = path.extname(file.originalname);
      const fileName = `${folder}/${uuidv4()}${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(this.buckets.images)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.buckets.images)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload proposal document (PDFs, supporting documents)
   */
  async uploadProposalFile(file, proposalCode, type = 'document') {
    try {
      const fileExt = path.extname(file.originalname);
      const fileName = `${proposalCode}/${type}/${uuidv4()}${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(this.buckets.proposalFiles)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.buckets.proposalFiles)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Proposal file upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload AI report (generated PDF)
   */
  async uploadAIReport(buffer, proposalCode, versionNumber) {
    try {
      const fileName = `${proposalCode}/ai-reports/v${versionNumber}-${Date.now()}.pdf`;

      const { data, error } = await this.supabase.storage
        .from(this.buckets.proposalFiles)
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.buckets.proposalFiles)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('AI report upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload reviewer/committee report PDF
   */
  async uploadReviewerReport(buffer, proposalCode, authorId) {
    try {
      const fileName = `${proposalCode}/reports/${authorId}-${Date.now()}.pdf`;

      const { data, error } = await this.supabase.storage
        .from(this.buckets.proposalFiles)
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.buckets.proposalFiles)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Reviewer report upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket, filePath) {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('File delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get file URL
   */
  getPublicUrl(bucket, filePath) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
}

export default new StorageService();
