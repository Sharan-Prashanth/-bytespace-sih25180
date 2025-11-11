// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sih25180.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Proposal endpoints
  PROPOSALS: `${API_BASE_URL}/api/proposals`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  
  // Collaboration endpoints
  INVITE_COLLABORATOR: `${API_BASE_URL}/api/collaboration/invite`,
};

// Helper function to build proposal-specific URLs
export const getProposalUrl = (id, action = '') => {
  if (action) {
    return `${API_BASE_URL}/api/proposals/${id}/${action}`;
  }
  return `${API_BASE_URL}/api/proposals/${id}`;
};

export default API_BASE_URL;