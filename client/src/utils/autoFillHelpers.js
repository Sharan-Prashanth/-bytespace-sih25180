/**
 * Auto-fill utility functions for proposal documents
 */

/**
 * Fetch a PDF from the public folder and convert it to a File object
 * @param {string} filename - Name of the file in public/files/forms/
 * @param {string} displayName - Display name for the file
 * @returns {Promise<File>} File object
 */
export const fetchPDFAsFile = async (filename, displayName = null) => {
  try {
    const response = await fetch(`/files/forms/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], displayName || filename, { type: 'application/pdf' });
    
    return file;
  } catch (error) {
    console.error('Error fetching PDF:', error);
    throw error;
  }
};

/**
 * Mapping of document types to their corresponding PDF files
 */
export const AUTO_FILL_MAPPING = {
  // Initial Documents (Stage 2)
  coveringLetter: {
    filename: 'Cover-Letter-Samples.pdf',
    displayName: 'Cover-Letter-Samples.pdf'
  },
  cv: {
    filename: 'resume.pdf',
    displayName: 'resume.pdf'
  },
  
  // Additional Forms (Stage 4)
  formia: {
    filename: 'FORM-IA_NEW_sujan.pdf',
    displayName: 'FORM-IA_NEW_sujan.pdf'
  },
  formix: {
    filename: 'FORM-IX_NEW.pdf',
    displayName: 'FORM-IX_NEW.pdf'
  },
  formx: {
    filename: 'FORM-X_NEW.pdf',
    displayName: 'FORM-X_NEW.pdf'
  },
  formxi: {
    filename: 'FORM-XI_NEW.pdf',
    displayName: 'FORM-XI_NEW.pdf'
  },
  formxii: {
    filename: 'FORM-XII_NEW.pdf',
    displayName: 'FORM-XII_NEW.pdf'
  },
  
  // Supporting Documents (Stage 5)
  orgDetails: {
    filename: 'org_details.pdf',
    displayName: 'org_details.pdf'
  },
  infrastructure: {
    filename: 'detial.pdf',
    displayName: 'detial.pdf'
  },
  expertise: {
    filename: 'DETAILS OF EXPERTISE AVAILABLE.pdf',
    displayName: 'DETAILS OF EXPERTISE AVAILABLE.pdf'
  },
  rdComponent: {
    filename: 'R&D-proposal.pdf',
    displayName: 'R&D-proposal.pdf'
  },
  benefits: {
    filename: 'R&D-proposal.pdf',
    displayName: 'R&D-proposal.pdf'
  },
  webSurvey: {
    filename: 'R&D-proposal.pdf',
    displayName: 'R&D-proposal.pdf'
  },
  researchContent: {
    filename: 'R&D-proposal.pdf',
    displayName: 'R&D-proposal.pdf'
  },
  collaboration: {
    filename: 'R&D-proposal.pdf',
    displayName: 'R&D-proposal.pdf'
  }
};

/**
 * Get auto-fill file for a document type
 * @param {string} docType - Document type identifier
 * @returns {Promise<File>} File object
 */
export const getAutoFillFile = async (docType) => {
  const mapping = AUTO_FILL_MAPPING[docType];
  if (!mapping) {
    throw new Error(`No auto-fill mapping found for ${docType}`);
  }
  
  return await fetchPDFAsFile(mapping.filename, mapping.displayName);
};
