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
  Plus, 
  Search as SearchIcon, 
  Eye, 
  Edit, 
  TrendingUp,
  Clock,
  MessageSquare,
  BarChart3
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

function InvestigatorDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // API Endpoint: GET /api/proposals/investigator
      const response = await apiClient.get('/api/proposals/investigator');
      console.log('📊 Dashboard proposals response:', response.data);
      setProposals(Array.isArray(response.data.proposals) ? response.data.proposals : []);
      console.log('✅ Loaded proposals:', response.data.proposals?.length || 0);
    } catch (error) {
      console.error("❌ Error fetching proposals:", error);
      // Mock data for development
      setProposals([
        {
          id: "PROP001",
          title: "AI-Powered Coal Quality Assessment System",
          status: PROPOSAL_STATUS.CMPDI_REVIEW,
          stageOwner: "CMPDI",
          domain: "Artificial Intelligence",
          submissionDate: "2025-09-20T10:00:00Z",
          lastUpdated: "2025-09-25T14:30:00Z",
          budget: 285000,
          hasComments: true
        },
        {
          id: "PROP002",
          title: "Sustainable Mining Waste Management",
          status: PROPOSAL_STATUS.DRAFT,
          stageOwner: "Principal Investigator",
          domain: "Environmental Technology",
          submissionDate: null,
          lastUpdated: "2025-09-23T16:20:00Z",
          budget: 195000,
          hasComments: false
        },
        {
          id: "PROP003",
          title: "Advanced Coal Gasification Process",
          status: PROPOSAL_STATUS.TSSRC_REVIEW,
          stageOwner: "TSSRC",
          domain: "Clean Coal Technology",
          submissionDate: "2025-09-15T09:00:00Z",
          lastUpdated: "2025-09-22T11:45:00Z",
          budget: 420000,
          hasComments: true
        },
        {
          id: "PROP004",
          title: "Digital Twin for Mining Operations",
          status: PROPOSAL_STATUS.PROJECT_ONGOING,
          stageOwner: "Project Team",
          domain: "Digital Technology",
          submissionDate: "2025-08-10T08:00:00Z",
          lastUpdated: "2025-09-20T13:00:00Z",
          budget: 350000,
          hasComments: false
        },
        {
          id: "PROP005",
          title: "Carbon Capture Technology Research",
          status: PROPOSAL_STATUS.CMPDI_REJECTED,
          stageOwner: "CMPDI",
          domain: "Carbon Management",
          submissionDate: "2025-09-05T10:30:00Z",
          lastUpdated: "2025-09-18T15:20:00Z",
          budget: 485000,
          hasComments: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get last draft proposal
  const lastDraft = proposals.find(p => p.status === PROPOSAL_STATUS.DRAFT);

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === 'all' || proposal.domain === domainFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all' && proposal.lastUpdated) {
      const daysDiff = Math.floor((new Date() - new Date(proposal.lastUpdated)) / (1000 * 60 * 60 * 24));
      if (dateRange === '7days') matchesDate = daysDiff <= 7;
      if (dateRange === '30days') matchesDate = daysDiff <= 30;
      if (dateRange === '90days') matchesDate = daysDiff <= 90;
    }
    
    return matchesStatus && matchesSearch && matchesDomain && matchesDate;
  });

  // Get unique domains
  const uniqueDomains = [...new Set(proposals.map(p => p.domain).filter(Boolean))];

  // Calculate stats
  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === PROPOSAL_STATUS.DRAFT).length,
    underReview: proposals.filter(p => 
      p.status === PROPOSAL_STATUS.CMPDI_REVIEW || 
      p.status === PROPOSAL_STATUS.EXPERT_REVIEW ||
      p.status === PROPOSAL_STATUS.TSSRC_REVIEW ||
      p.status === PROPOSAL_STATUS.SSRC_REVIEW
    ).length,
    approved: proposals.filter(p => 
      p.status === PROPOSAL_STATUS.PROJECT_ONGOING || 
      p.status === PROPOSAL_STATUS.PROJECT_COMPLETED
    ).length,
    rejected: proposals.filter(p => 
      p.status === PROPOSAL_STATUS.CMPDI_REJECTED || 
      p.status === PROPOSAL_STATUS.TSSRC_REJECTED ||
      p.status === PROPOSAL_STATUS.SSRC_REJECTED
    ).length,
    totalBudget: proposals.reduce((sum, p) => sum + (p.budget || 0), 0)
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[280px]">
        {/* Animated geometric patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-6 left-10 w-12 h-12 border border-blue-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-10 h-10 border border-indigo-400/20 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-12 left-32 w-8 h-8 bg-blue-500/10 rounded-full animate-bounce"></div>
          <div className="absolute top-12 right-40 w-4 h-4 bg-indigo-400/20 rounded-full animate-ping"></div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        
        {/* Header Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="ml-6">
                <h1 className="text-white text-4xl font-black tracking-tight">
                  Principal Investigator
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-blue-100 font-semibold text-lg">Welcome, {user?.fullName}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all duration-300 text-white"
            >
              Logout
            </button>
          </div>
          
          {/* PRISM Banner */}
          <div className="bg-orange-600 backdrop-blur-md rounded-2xl p-4 border border-orange-300/40 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-white to-orange-50 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border border-orange-200/50">
                  <img 
                    src="/images/prism brand logo.png" 
                    alt="PRISM Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1 flex items-center">
                  <span className="text-white drop-shadow-md tracking-wide">PRISM</span>
                  <div className="ml-3 px-2 py-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full flex items-center justify-center border border-blue-300/40 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-1.5 animate-pulse"></div>
                    <span className="text-white text-xs font-semibold drop-shadow-sm">INVESTIGATOR PORTAL</span>
                  </div>
                </h2>
                <p className="text-orange-50 text-sm leading-relaxed font-medium opacity-95 drop-shadow-sm">
                  Proposal Review & Innovation Support Mechanism - Principal Investigator Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Dashboard */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            Research Analytics
          </h2>
          
          <div className="grid md:grid-cols-6 gap-6">
            {/* Total Proposals Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.total} duration={2000} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Total Proposals</h3>
              </div>
            </div>

            {/* Draft Proposals Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.draft} duration={2200} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Draft</h3>
              </div>
            </div>

            {/* Under Review Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.underReview} duration={2400} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Under Review</h3>
              </div>
            </div>

            {/* Approved Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.approved} duration={2600} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Approved</h3>
              </div>
            </div>

            {/* Rejected Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.rejected} duration={2800} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Rejected</h3>
              </div>
            </div>

            {/* Total Budget Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-black mb-2">
                  ₹<AnimatedCounter targetValue={Math.floor(stats.totalBudget / 1000)} duration={3000} />k
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Total Budget</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1 flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <SearchIcon className="w-6 h-6 text-orange-600" />
                </div>
                Proposal Management
              </h2>
              <p className="text-gray-500 text-sm">Filter and manage your research proposals</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {lastDraft && (
                <Link href={`/proposal/create?draft=${lastDraft.id}`}>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105">
                    <Edit className="w-5 h-5" />
                    Continue Last Draft
                  </button>
                </Link>
              )}
              <Link href="/proposal/create">
                <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105">
                  <Plus className="w-5 h-5" />
                  New Proposal
                </button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by Proposal ID or Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value={PROPOSAL_STATUS.DRAFT}>Draft</option>
                <option value={PROPOSAL_STATUS.CMPDI_REVIEW}>CMPDI Review</option>
                <option value={PROPOSAL_STATUS.TSSRC_REVIEW}>TSSRC Review</option>
                <option value={PROPOSAL_STATUS.SSRC_REVIEW}>SSRC Review</option>
                <option value={PROPOSAL_STATUS.PROJECT_ONGOING}>Ongoing</option>
              </select>
            </div>

            {/* Domain Filter */}
            <div>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
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
        <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden animate-slideInUp" style={{ animationDelay: '0.3s' }}>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-black mb-1">Research Proposals</h2>
                <p className="text-gray-500 text-sm">
                  Showing {filteredProposals.length} of {proposals.length} proposals
                </p>
              </div>
              <div className="text-xs text-gray-500 text-right">
                <div>Government of India</div>
                <div>Ministry of Coal</div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredProposals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Proposal ID</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Title</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Stage Owner</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Submitted</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Last Updated</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map((proposal, index) => {
                      const statusConfig = STATUS_CONFIG[proposal.status];
                      return (
                        <tr 
                          key={proposal.id} 
                          className="border-b border-orange-100 hover:bg-orange-50 transition-colors duration-200"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="py-4 px-4">
                            <span className="text-sm font-semibold text-black">{proposal.id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-black">{proposal.title}</span>
                              {proposal.hasComments && (
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{proposal.domain}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig?.className || 'bg-gray-100 text-gray-600'}`}>
                              {statusConfig?.label || proposal.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">{proposal.stageOwner}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">
                              {proposal.submissionDate ? formatDate(proposal.submissionDate) : '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">{formatDate(proposal.lastUpdated)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              {proposal.status === PROPOSAL_STATUS.DRAFT ? (
                                <Link href={`/proposal/create?draft=${proposal.id}`}>
                                  <button className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors" title="Edit Draft">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </Link>
                              ) : (
                                <Link href={`/proposal/collaborate/${proposal.id}`}>
                                  <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Collaborate">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </Link>
                              )}
                              <Link href={`/proposal/view/${proposal.id}`}>
                                <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="View">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <Link href={`/proposal/track/${proposal.id}`}>
                                <button className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors" title="Track Progress">
                                  <BarChart3 className="w-4 h-4" />
                                </button>
                              </Link>
                              {proposal.hasComments && (
                                <Link href={`/proposal/collaborate/${proposal.id}#comments`}>
                                  <button className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors" title="View Comments">
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center border border-slate-200">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">No Research Proposals Found</h3>
                <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto leading-relaxed">
                  {filterStatus === 'all' && !searchQuery
                    ? "You haven't created any research proposals yet. Start by submitting your first proposal."
                    : 'No proposals match your search criteria. Try adjusting your filters.'
                  }
                </p>
                <Link href="/proposal/create">
                  <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    Create Research Proposal
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestigatorDashboard() {
  return (
    <ProtectedRoute>
      <InvestigatorDashboardContent />
    </ProtectedRoute>
  );
}
