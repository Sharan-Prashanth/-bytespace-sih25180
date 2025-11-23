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
  Users,
  Clock,
  MessageSquare,
  BarChart3,
  CheckCircle,
  AlertCircle,
  UserPlus,
  FileCheck
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

function CMPDIDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // API Endpoint: GET /api/proposals/cmpdi
      const response = await apiClient.get('/api/proposals/cmpdi');
      setProposals(Array.isArray(response.data.proposals) ? response.data.proposals : []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      // Mock data for development
      setProposals([
        {
          id: "PROP001",
          title: "AI-Powered Coal Quality Assessment System",
          principalInvestigator: "Dr. Rajesh Kumar",
          organization: "IIT Delhi",
          submittedDate: "2025-09-20T10:00:00Z",
          domain: "Artificial Intelligence",
          subStatus: "initial_review",
          assignedExperts: [],
          expertReportsReceived: 0,
          clarificationRequested: false
        },
        {
          id: "PROP002",
          title: "Sustainable Mining Waste Management",
          principalInvestigator: "Dr. Priya Sharma",
          organization: "CSIR-CIMFR",
          submittedDate: "2025-09-18T14:30:00Z",
          domain: "Environmental Technology",
          subStatus: "with_experts",
          assignedExperts: ["Dr. A. Verma", "Dr. B. Singh"],
          expertReportsReceived: 1,
          clarificationRequested: false
        },
        {
          id: "PROP003",
          title: "Advanced Coal Gasification Process",
          principalInvestigator: "Dr. Amit Patel",
          organization: "NEIST",
          submittedDate: "2025-09-15T09:00:00Z",
          domain: "Clean Coal Technology",
          subStatus: "clarification_pending",
          assignedExperts: ["Dr. C. Reddy", "Dr. D. Gupta"],
          expertReportsReceived: 2,
          clarificationRequested: true
        },
        {
          id: "PROP004",
          title: "Digital Twin for Mining Operations",
          principalInvestigator: "Dr. Sunita Mehta",
          organization: "NIT Rourkela",
          submittedDate: "2025-09-12T11:45:00Z",
          domain: "Digital Technology",
          subStatus: "ready_for_tssrc",
          assignedExperts: ["Dr. E. Kumar", "Dr. F. Joshi"],
          expertReportsReceived: 2,
          clarificationRequested: false
        },
        {
          id: "PROP005",
          title: "Carbon Capture Technology Research",
          principalInvestigator: "Dr. Vikram Singh",
          organization: "IIT Kharagpur",
          submittedDate: "2025-09-22T16:20:00Z",
          domain: "Carbon Management",
          subStatus: "initial_review",
          assignedExperts: [],
          expertReportsReceived: 0,
          clarificationRequested: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter proposals by tab
  const getProposalsByTab = () => {
    switch (activeTab) {
      case 'incoming':
        return proposals.filter(p => p.subStatus === 'initial_review');
      case 'with_experts':
        return proposals.filter(p => p.subStatus === 'with_experts');
      case 'clarification':
        return proposals.filter(p => p.subStatus === 'clarification_pending');
      case 'completed':
        return proposals.filter(p => p.subStatus === 'ready_for_tssrc');
      default:
        return proposals;
    }
  };

  // Apply additional filters
  const filteredProposals = getProposalsByTab().filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubStatus = subStatusFilter === 'all' || proposal.subStatus === subStatusFilter;
    const matchesDomain = domainFilter === 'all' || proposal.domain === domainFilter;
    const matchesOrg = organizationFilter === 'all' || proposal.organization === organizationFilter;
    
    return matchesSearch && matchesSubStatus && matchesDomain && matchesOrg;
  });

  // Get unique values for filters
  const uniqueDomains = [...new Set(proposals.map(p => p.domain).filter(Boolean))];
  const uniqueOrganizations = [...new Set(proposals.map(p => p.organization).filter(Boolean))];

  // Calculate stats
  const stats = {
    newProposals: proposals.filter(p => p.subStatus === 'initial_review').length,
    underReview: proposals.filter(p => p.subStatus === 'with_experts').length,
    withExperts: proposals.reduce((sum, p) => sum + p.assignedExperts.length, 0),
    clarificationPending: proposals.filter(p => p.subStatus === 'clarification_pending').length,
    readyForTSSRC: proposals.filter(p => p.subStatus === 'ready_for_tssrc').length
  };

  const subStatusLabels = {
    initial_review: "Initial Review",
    with_experts: "With Experts",
    clarification_pending: "Clarification Pending",
    ready_for_tssrc: "Ready for TSSRC"
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
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="ml-6">
                <h1 className="text-white text-4xl font-black tracking-tight">
                  CMPDI Review
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
                    <span className="text-white text-xs font-semibold drop-shadow-sm">CMPDI PORTAL</span>
                  </div>
                </h2>
                <p className="text-orange-50 text-sm leading-relaxed font-medium opacity-95 drop-shadow-sm">
                  Proposal Review & Innovation Support Mechanism - CMPDI Review Dashboard
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
            Review Analytics
          </h2>
          
          <div className="grid md:grid-cols-5 gap-6">
            {/* New Proposals Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.newProposals} duration={2000} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">New Proposals</h3>
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
                  <AnimatedCounter targetValue={stats.underReview} duration={2200} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Under Review</h3>
              </div>
            </div>

            {/* With Experts Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.withExperts} duration={2400} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">With Experts</h3>
              </div>
            </div>

            {/* Clarification Pending Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.clarificationPending} duration={2600} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Clarification Pending</h3>
              </div>
            </div>

            {/* Ready for TSSRC Card */}
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-6 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-4xl font-black text-black mb-2">
                  <AnimatedCounter targetValue={stats.readyForTSSRC} duration={2800} />
                </div>
                <h3 className="text-sm font-bold text-black mb-3">Ready for TSSRC</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1 flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <SearchIcon className="w-6 h-6 text-orange-600" />
                </div>
                Proposal Queue
              </h2>
              <p className="text-gray-500 text-sm">Review and manage incoming proposals</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'incoming'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Incoming ({stats.newProposals})
            </button>
            <button
              onClick={() => setActiveTab('with_experts')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'with_experts'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              With Experts ({stats.underReview})
            </button>
            <button
              onClick={() => setActiveTab('clarification')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'clarification'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Clarification Pending ({stats.clarificationPending})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Completed ({stats.readyForTSSRC})
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by ID, Title, or PI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
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

            {/* Organization Filter */}
            <div>
              <select
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Organizations</option>
                {uniqueOrganizations.map(org => (
                  <option key={org} value={org}>{org}</option>
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
                <h2 className="text-xl font-bold text-black mb-1">Proposals</h2>
                <p className="text-gray-500 text-sm">
                  Showing {filteredProposals.length} proposals
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
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">PI</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Submitted</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Domain</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Sub-status</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.map((proposal, index) => (
                      <tr 
                        key={proposal.id} 
                        className="border-b border-orange-100 hover:bg-orange-50 transition-colors duration-200"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm font-semibold text-black">{proposal.id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-black">{proposal.title}</span>
                            <span className="text-xs text-gray-500">{proposal.organization}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-black">{proposal.principalInvestigator}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-black">{formatDate(proposal.submittedDate)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">{proposal.domain}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                            {subStatusLabels[proposal.subStatus]}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Link href={`/proposal/review/${proposal.id}`}>
                              <button className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors" title="Open Review">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                            <Link href={`/proposal/collaborate/${proposal.id}`}>
                              <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Collaborate">
                                <Edit className="w-4 h-4" />
                              </button>
                            </Link>
                            {proposal.subStatus === 'initial_review' && (
                              <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Assign Experts">
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            {proposal.expertReportsReceived > 0 && (
                              <Link href={`/proposal/expert-reports/${proposal.id}`}>
                                <button className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors" title="View Expert Reports">
                                  <FileCheck className="w-4 h-4" />
                                </button>
                              </Link>
                            )}
                            <button className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors" title="Request Clarification">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {proposal.subStatus === 'ready_for_tssrc' && (
                              <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Record Decision">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center border border-slate-200">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">No Proposals Found</h3>
                <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto leading-relaxed">
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

export default function CMPDIDashboard() {
  return (
    <ProtectedRoute>
      <CMPDIDashboardContent />
    </ProtectedRoute>
  );
}
