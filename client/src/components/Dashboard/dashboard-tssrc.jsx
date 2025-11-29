'use client';

import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingScreen from "../../components/LoadingScreen";
import Link from "next/link";
import { useRouter } from "next/router";
import apiClient from "../../utils/api";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate } from "../../utils/statusConfig";
import { 
  FileText, 
  Search as SearchIcon, 
  Eye, 
  Edit, 
  Clock,
  MessageSquare,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileCheck,
  Users
} from "lucide-react";

// Counter animation component
const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(targetValue * easeOutQuart));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration]);
  
  return <span>{count}</span>;
};

function TSSRCDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/proposals');
      const proposalData = response.data?.data?.proposals || response.data?.proposals || [];
      setProposals(Array.isArray(proposalData) ? proposalData : []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter proposals by tab
  const getProposalsByTab = () => {
    switch (activeTab) {
      case 'incoming':
        return proposals.filter(p => p.status === 'CMPDI_APPROVED');
      case 'deliberation':
        return proposals.filter(p => p.status === 'TSSRC_REVIEW');
      case 'approved':
        return proposals.filter(p => p.status === 'TSSRC_APPROVED');
      case 'rejected':
        return proposals.filter(p => p.status === 'TSSRC_REJECTED');
      default:
        return proposals;
    }
  };

  // Apply additional filters
  const filteredProposals = getProposalsByTab().filter(proposal => {
    const matchesSearch = proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.proposalCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.createdBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubStatus = subStatusFilter === 'all' || proposal.status === subStatusFilter;
    const matchesDomain = domainFilter === 'all' || proposal.domain === domainFilter;
    
    return matchesSearch && matchesSubStatus && matchesDomain;
  });

  // Get unique domains
  const uniqueDomains = [...new Set(proposals.map(p => p.domain).filter(Boolean))];

  // Calculate stats
  const stats = {
    receivedFromCMPDI: proposals.filter(p => p.status === 'CMPDI_APPROVED').length,
    underReview: proposals.filter(p => p.status === 'TSSRC_REVIEW').length,
    approved: proposals.filter(p => p.status === 'TSSRC_APPROVED').length,
    rejected: proposals.filter(p => p.status === 'TSSRC_REJECTED').length
  };

  const statusLabels = {
    'CMPDI_APPROVED': "Incoming from CMPDI",
    'TSSRC_REVIEW': "Under Review",
    'TSSRC_APPROVED': "Approved for SSRC",
    'TSSRC_REJECTED': "Rejected"
  };

  const subStatusLabels = {
    'incoming_cmpdi': "Incoming",
    'under_deliberation': "Under Deliberation",
    'clarification_pending': "Clarification",
    'recommended_ssrc': "Recommended",
    'rejected': "Rejected"
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">
      {/* Header Section - Compact */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">TSSRC Review</h1>
            <p className="text-xs text-slate-500">Welcome, {user?.fullName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600">System Active</span>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors border border-slate-200 shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Received from CMPDI Card */}
            <div className="group relative overflow-hidden border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Received</p>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter targetValue={stats.receivedFromCMPDI} duration={2000} />
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Under Review Card */}
            <div className="group relative overflow-hidden border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Review</p>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter targetValue={stats.underReview} duration={2200} />
                  </div>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Clarification Pending Card */}
            <div className="group relative overflow-hidden border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clarification</p>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter targetValue={stats.clarificationPending || 0} duration={2400} />
                  </div>
                </div>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Recommended to SSRC Card */}
            <div className="group relative overflow-hidden border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended</p>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter targetValue={stats.recommendedToSSRC || 0} duration={2600} />
                  </div>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Rejected Card */}
            <div className="group relative overflow-hidden border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <AnimatedCounter targetValue={stats.rejected} duration={2800} />
                  </div>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                  <SearchIcon className="w-4 h-4 text-blue-600" />
                </div>
                Proposal Queue
              </h2>
              <p className="text-slate-500 text-xs">Review proposals from CMPDI</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'incoming'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Incoming ({stats.receivedFromCMPDI})
            </button>
            <button
              onClick={() => setActiveTab('deliberation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'deliberation'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Under Deliberation ({stats.underReview})
            </button>
            <button
              onClick={() => setActiveTab('clarification')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'clarification'
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Clarification ({stats.clarificationPending || 0})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed ({(stats.recommendedToSSRC || 0) + stats.rejected})
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by ID, Title, or PI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 text-sm"
              />
            </div>

            {/* Domain Filter */}
            <div>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Domains</option>
                {uniqueDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/50 p-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-0.5">Proposals</h2>
                <p className="text-slate-500 text-xs">
                  Showing {filteredProposals.length} proposals
                </p>
              </div>
              <div className="text-[10px] text-slate-400 text-right uppercase tracking-wider font-medium">
                <div>Government of India</div>
                <div>Ministry of Coal</div>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {filteredProposals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal ID</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PI</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CMPDI Summary</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map((proposal, index) => (
                      <tr 
                        key={proposal._id} 
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-slate-700">{proposal.proposalCode || proposal._id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 line-clamp-1">{proposal.title}</span>
                            <span className="text-xs text-slate-500">{proposal.organization}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600">{proposal.principalInvestigator}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500 max-w-xs line-clamp-2">{proposal.cmpdiSummary || "No summary available"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${
                            proposal.subStatus === 'recommended_ssrc' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            proposal.subStatus === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {subStatusLabels[proposal.subStatus] || statusLabels[proposal.status] || proposal.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/proposal/tssrc-review/${proposal._id}`}>
                              <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200" title="Open TSSRC Review">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <Link href={`/proposal/collaborate/${proposal._id}?mode=suggestion`}>
                              <button className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200" title="Editor (Suggestion)">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <Link href={`/proposal/cmpdi-reports/${proposal._id}`}>
                              <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200" title="View Reports">
                                <FileCheck className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Proposals Found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  No proposals match your search criteria. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TSSRCDashboard() {
  return (
    <ProtectedRoute>
      <TSSRCDashboardContent />
    </ProtectedRoute>
  );
}
