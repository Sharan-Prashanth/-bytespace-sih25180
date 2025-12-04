import { 
  FileText, 
  Search, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Users,
  Award
} from "lucide-react";

// Proposal Status Constants - Match backend enum values exactly
export const PROPOSAL_STATUS = {
  DRAFT: 'DRAFT',
  AI_EVALUATION_PENDING: 'AI_EVALUATION_PENDING',
  AI_REJECTED: 'AI_REJECTED',
  CMPDI_REVIEW: 'CMPDI_REVIEW',
  CMPDI_EXPERT_REVIEW: 'CMPDI_EXPERT_REVIEW',
  CMPDI_ACCEPTED: 'CMPDI_ACCEPTED',
  CMPDI_REJECTED: 'CMPDI_REJECTED',
  TSSRC_REVIEW: 'TSSRC_REVIEW',
  TSSRC_ACCEPTED: 'TSSRC_ACCEPTED',
  TSSRC_REJECTED: 'TSSRC_REJECTED',
  SSRC_REVIEW: 'SSRC_REVIEW',
  SSRC_ACCEPTED: 'SSRC_ACCEPTED',
  SSRC_REJECTED: 'SSRC_REJECTED'
};

// Status Display Configuration with professional icons
export const STATUS_CONFIG = {
  [PROPOSAL_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-black border-gray-300',
    Icon: FileText,
    description: 'Proposal is being prepared'
  },
  [PROPOSAL_STATUS.AI_EVALUATION_PENDING]: {
    label: 'AI Evaluation Pending',
    color: 'bg-purple-100 text-black border-purple-300',
    Icon: BarChart,
    description: 'Submitted, waiting for AI evaluation'
  },
  [PROPOSAL_STATUS.AI_REJECTED]: {
    label: 'AI Rejected',
    color: 'bg-orange-100 text-black border-orange-300',
    Icon: AlertCircle,
    description: 'AI evaluation rejected - can be modified and resubmitted'
  },
  [PROPOSAL_STATUS.CMPDI_REVIEW]: {
    label: 'CMPDI Review',
    color: 'bg-yellow-100 text-black border-yellow-300',
    Icon: Search,
    description: 'Under CMPDI scrutiny'
  },
  [PROPOSAL_STATUS.CMPDI_EXPERT_REVIEW]: {
    label: 'Expert Review',
    color: 'bg-indigo-100 text-black border-indigo-300',
    Icon: Users,
    description: 'Being reviewed by domain experts'
  },
  [PROPOSAL_STATUS.CMPDI_ACCEPTED]: {
    label: 'CMPDI Accepted',
    color: 'bg-green-100 text-black border-green-300',
    Icon: CheckCircle,
    description: 'Approved by CMPDI, forwarded to TSSRC'
  },
  [PROPOSAL_STATUS.CMPDI_REJECTED]: {
    label: 'CMPDI Rejected',
    color: 'bg-red-100 text-black border-red-300',
    Icon: XCircle,
    description: 'Rejected by CMPDI - final decision'
  },
  [PROPOSAL_STATUS.TSSRC_REVIEW]: {
    label: 'TSSRC Review',
    color: 'bg-cyan-100 text-black border-cyan-300',
    Icon: Search,
    description: 'Under Technical Sub-Committee review'
  },
  [PROPOSAL_STATUS.TSSRC_ACCEPTED]: {
    label: 'TSSRC Accepted',
    color: 'bg-emerald-100 text-black border-emerald-300',
    Icon: CheckCircle,
    description: 'Approved by TSSRC, forwarded to SSRC'
  },
  [PROPOSAL_STATUS.TSSRC_REJECTED]: {
    label: 'TSSRC Rejected',
    color: 'bg-rose-100 text-black border-rose-300',
    Icon: XCircle,
    description: 'Rejected by TSSRC - final decision'
  },
  [PROPOSAL_STATUS.SSRC_REVIEW]: {
    label: 'SSRC Review',
    color: 'bg-violet-100 text-black border-violet-300',
    Icon: Search,
    description: 'Under SSRC final review'
  },
  [PROPOSAL_STATUS.SSRC_ACCEPTED]: {
    label: 'SSRC Accepted',
    color: 'bg-teal-100 text-black border-teal-300',
    Icon: Award,
    description: 'Final approval granted - process complete'
  },
  [PROPOSAL_STATUS.SSRC_REJECTED]: {
    label: 'SSRC Rejected',
    color: 'bg-red-200 text-black border-red-400',
    Icon: XCircle,
    description: 'Final rejection by SSRC'
  }
};

// Helper to check if a status is a rejection that cannot be modified
export const isRejectedFinal = (status) => {
  return [
    PROPOSAL_STATUS.CMPDI_REJECTED,
    PROPOSAL_STATUS.TSSRC_REJECTED,
    PROPOSAL_STATUS.SSRC_REJECTED
  ].includes(status);
};

// Helper to check if a proposal can be modified (AI rejected proposals can be modified)
export const canModifyProposal = (status) => {
  return status === PROPOSAL_STATUS.DRAFT || status === PROPOSAL_STATUS.AI_REJECTED;
};

// Helper to check if status is any kind of rejection
export const isRejected = (status) => {
  return [
    PROPOSAL_STATUS.AI_REJECTED,
    PROPOSAL_STATUS.CMPDI_REJECTED,
    PROPOSAL_STATUS.TSSRC_REJECTED,
    PROPOSAL_STATUS.SSRC_REJECTED
  ].includes(status);
};

// Helper to check if proposal is SSRC accepted (final approval - complete)
export const isSSRCAccepted = (status) => {
  return status === PROPOSAL_STATUS.SSRC_ACCEPTED;
};

// Helper function to get status configuration
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[PROPOSAL_STATUS.DRAFT];
};

// Helper function to format dates
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to get time since
export const getTimeSince = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
};

export default {
  PROPOSAL_STATUS,
  STATUS_CONFIG,
  getStatusConfig,
  formatDate,
  getTimeSince
};
