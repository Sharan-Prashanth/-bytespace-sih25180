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

// Proposal Status Constants
export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  AI_EVALUATION: 'ai_evaluation',
  SUBMITTED: 'submitted',
  CMPDI_REVIEW: 'cmpdi_review',
  CMPDI_CLARIFICATION: 'cmpdi_clarification_requested',
  EXPERT_REVIEW: 'expert_review',
  CMPDI_APPROVED: 'cmpdi_approved',
  CMPDI_REJECTED: 'cmpdi_rejected',
  TSSRC_REVIEW: 'tssrc_review',
  TSSRC_CLARIFICATION: 'tssrc_clarification_requested',
  TSSRC_APPROVED: 'tssrc_approved',
  TSSRC_REJECTED: 'tssrc_rejected',
  SSRC_REVIEW: 'ssrc_review',
  SSRC_APPROVED: 'ssrc_approved',
  SSRC_REJECTED: 'ssrc_rejected',
  PROJECT_ONGOING: 'project_ongoing',
  PROJECT_COMPLETED: 'project_completed'
};

// Status Display Configuration with professional icons
export const STATUS_CONFIG = {
  [PROPOSAL_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-black border-gray-300',
    Icon: FileText,
    description: 'Proposal is being prepared'
  },
  [PROPOSAL_STATUS.AI_EVALUATION]: {
    label: 'AI Evaluation',
    color: 'bg-purple-100 text-black border-purple-300',
    Icon: BarChart,
    description: 'Being evaluated by AI'
  },
  [PROPOSAL_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: 'bg-blue-100 text-black border-blue-300',
    Icon: TrendingUp,
    description: 'Awaiting initial review'
  },
  [PROPOSAL_STATUS.CMPDI_REVIEW]: {
    label: 'CMPDI Review',
    color: 'bg-yellow-100 text-black border-yellow-300',
    Icon: Search,
    description: 'Under CMPDI scrutiny'
  },
  [PROPOSAL_STATUS.CMPDI_CLARIFICATION]: {
    label: 'Clarification Required',
    color: 'bg-orange-100 text-black border-orange-300',
    Icon: AlertCircle,
    description: 'CMPDI has requested clarifications'
  },
  [PROPOSAL_STATUS.EXPERT_REVIEW]: {
    label: 'Expert Review',
    color: 'bg-indigo-100 text-black border-indigo-300',
    Icon: Users,
    description: 'Being reviewed by domain experts'
  },
  [PROPOSAL_STATUS.CMPDI_APPROVED]: {
    label: 'CMPDI Approved',
    color: 'bg-green-100 text-black border-green-300',
    Icon: CheckCircle,
    description: 'Approved by CMPDI'
  },
  [PROPOSAL_STATUS.CMPDI_REJECTED]: {
    label: 'CMPDI Rejected',
    color: 'bg-red-100 text-black border-red-300',
    Icon: XCircle,
    description: 'Rejected by CMPDI'
  },
  [PROPOSAL_STATUS.TSSRC_REVIEW]: {
    label: 'TSSRC Review',
    color: 'bg-cyan-100 text-black border-cyan-300',
    Icon: Search,
    description: 'Under Technical Sub-Committee review'
  },
  [PROPOSAL_STATUS.TSSRC_CLARIFICATION]: {
    label: 'TSSRC Clarification',
    color: 'bg-amber-100 text-black border-amber-300',
    Icon: AlertCircle,
    description: 'TSSRC has requested clarifications'
  },
  [PROPOSAL_STATUS.TSSRC_APPROVED]: {
    label: 'TSSRC Approved',
    color: 'bg-emerald-100 text-black border-emerald-300',
    Icon: CheckCircle,
    description: 'Approved by TSSRC'
  },
  [PROPOSAL_STATUS.TSSRC_REJECTED]: {
    label: 'TSSRC Rejected',
    color: 'bg-rose-100 text-black border-rose-300',
    Icon: XCircle,
    description: 'Rejected by TSSRC'
  },
  [PROPOSAL_STATUS.SSRC_REVIEW]: {
    label: 'SSRC Review',
    color: 'bg-violet-100 text-black border-violet-300',
    Icon: Search,
    description: 'Under SSRC final review'
  },
  [PROPOSAL_STATUS.SSRC_APPROVED]: {
    label: 'SSRC Approved',
    color: 'bg-teal-100 text-black border-teal-300',
    Icon: Award,
    description: 'Final approval granted'
  },
  [PROPOSAL_STATUS.SSRC_REJECTED]: {
    label: 'SSRC Rejected',
    color: 'bg-red-200 text-black border-red-400',
    Icon: XCircle,
    description: 'Final rejection'
  },
  [PROPOSAL_STATUS.PROJECT_ONGOING]: {
    label: 'Project Ongoing',
    color: 'bg-blue-200 text-black border-blue-400',
    Icon: Clock,
    description: 'Project is in progress'
  },
  [PROPOSAL_STATUS.PROJECT_COMPLETED]: {
    label: 'Project Completed',
    color: 'bg-green-200 text-black border-green-400',
    Icon: CheckCircle,
    description: 'Project successfully completed'
  }
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
