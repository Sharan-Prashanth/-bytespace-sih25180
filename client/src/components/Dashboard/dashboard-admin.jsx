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
  Users,
  BarChart3,
  Settings,
  UserPlus,
  Edit,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle
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

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // API Endpoints: GET /api/admin/users and GET /api/admin/proposals
      const [usersResponse, proposalsResponse] = await Promise.all([
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/admin/proposals')
      ]);
      setUsers(Array.isArray(usersResponse.data.users) ? usersResponse.data.users : []);
      setProposals(Array.isArray(proposalsResponse.data.proposals) ? proposalsResponse.data.proposals : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Mock data for development
      setUsers([
        {
          id: "USER001",
          fullName: "Dr. Rajesh Kumar",
          email: "rajesh.kumar@iitd.ac.in",
          roles: ["Investigator"],
          organization: "IIT Delhi",
          active: true,
          createdAt: "2025-01-15T10:00:00Z"
        },
        {
          id: "USER002",
          fullName: "Dr. Priya Sharma",
          email: "priya.sharma@cimfr.org",
          roles: ["Investigator"],
          organization: "CSIR-CIMFR",
          active: true,
          createdAt: "2025-02-20T14:30:00Z"
        },
        {
          id: "USER003",
          fullName: "Dr. Amit Verma",
          email: "amit.verma@expert.gov.in",
          roles: ["Expert"],
          organization: "Ministry of Coal",
          active: true,
          createdAt: "2025-03-10T09:00:00Z"
        },
        {
          id: "USER004",
          fullName: "Mr. Suresh Patil",
          email: "suresh.patil@cmpdi.gov.in",
          roles: ["CMPDI"],
          organization: "CMPDI",
          active: true,
          createdAt: "2025-01-25T11:45:00Z"
        },
        {
          id: "USER005",
          fullName: "Dr. Anjali Desai",
          email: "anjali.desai@inactive.org",
          roles: ["Investigator"],
          organization: "Regional Institute",
          active: false,
          createdAt: "2024-12-05T16:20:00Z"
        }
      ]);
      
      setProposals([
        {
          id: "PROP001",
          title: "AI-Powered Coal Quality Assessment System",
          principalInvestigator: "Dr. Rajesh Kumar",
          organization: "IIT Delhi",
          currentStage: "CMPDI Review",
          status: PROPOSAL_STATUS.CMPDI_REVIEW,
          createdAt: "2025-09-01T10:00:00Z"
        },
        {
          id: "PROP002",
          title: "Sustainable Mining Waste Management",
          principalInvestigator: "Dr. Priya Sharma",
          organization: "CSIR-CIMFR",
          currentStage: "TSSRC Review",
          status: PROPOSAL_STATUS.TSSRC_REVIEW,
          createdAt: "2025-09-05T14:30:00Z"
        },
        {
          id: "PROP003",
          title: "Advanced Coal Gasification Process",
          principalInvestigator: "Dr. Amit Patel",
          organization: "NEIST",
          currentStage: "Project Ongoing",
          status: PROPOSAL_STATUS.PROJECT_ONGOING,
          createdAt: "2025-08-20T09:00:00Z"
        },
        {
          id: "PROP004",
          title: "Digital Twin for Mining Operations",
          principalInvestigator: "Dr. Sunita Mehta",
          organization: "NIT Rourkela",
          currentStage: "SSRC Review",
          status: PROPOSAL_STATUS.SSRC_REVIEW,
          createdAt: "2025-09-10T11:45:00Z"
        },
        {
          id: "PROP005",
          title: "Carbon Capture Technology Research",
          principalInvestigator: "Dr. Vikram Singh",
          organization: "IIT Kharagpur",
          currentStage: "Draft",
          status: PROPOSAL_STATUS.DRAFT,
          createdAt: "2025-09-15T16:20:00Z"
        },
        {
          id: "PROP006",
          title: "Automated Mine Safety System",
          principalInvestigator: "Dr. Anjali Desai",
          organization: "IIT Bombay",
          currentStage: "CMPDI Rejected",
          status: PROPOSAL_STATUS.CMPDI_REJECTED,
          createdAt: "2025-08-25T12:00:00Z"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    const matchesOrg = organizationFilter === 'all' || user.organization === organizationFilter;
    
    return matchesSearch && matchesRole && matchesOrg;
  });

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesStage = stageFilter === 'all' || proposal.currentStage === stageFilter;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  // Get unique values for filters
  const uniqueOrganizations = [...new Set(users.map(u => u.organization).filter(Boolean))];
  const uniqueStages = [...new Set(proposals.map(p => p.currentStage).filter(Boolean))];

  // Calculate stats
  const userStats = {
    totalUsers: users.length,
    investigators: users.filter(u => u.roles.includes('Investigator')).length,
    experts: users.filter(u => u.roles.includes('Expert')).length,
    cmpdi: users.filter(u => u.roles.includes('CMPDI')).length,
    tssrc: users.filter(u => u.roles.includes('TSSRC')).length,
    ssrc: users.filter(u => u.roles.includes('SSRC')).length,
    activeUsers: users.filter(u => u.active).length,
    inactiveUsers: users.filter(u => !u.active).length
  };

  const proposalStats = {
    totalProposals: proposals.length,
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
    ).length
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
                  <Settings className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="ml-6">
                <h1 className="text-white text-4xl font-black tracking-tight">
                  Admin Dashboard
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
                    <span className="text-white text-xs font-semibold drop-shadow-sm">ADMIN PORTAL</span>
                  </div>
                </h2>
                <p className="text-orange-50 text-sm leading-relaxed font-medium opacity-95 drop-shadow-sm">
                  Proposal Review & Innovation Support Mechanism - Admin Dashboard
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
            System Analytics
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* User Stats */}
            <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-orange-600" />
                User Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={userStats.totalUsers} duration={2000} />
                  </div>
                  <div className="text-sm font-bold text-black">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={userStats.investigators} duration={2200} />
                  </div>
                  <div className="text-sm font-bold text-black">Investigators</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={userStats.experts} duration={2400} />
                  </div>
                  <div className="text-sm font-bold text-black">Experts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={userStats.activeUsers} duration={2600} />
                  </div>
                  <div className="text-sm font-bold text-black">Active</div>
                </div>
              </div>
            </div>

            {/* Proposal Stats */}
            <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                Proposal Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={proposalStats.totalProposals} duration={2000} />
                  </div>
                  <div className="text-sm font-bold text-black">Total Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={proposalStats.underReview} duration={2200} />
                  </div>
                  <div className="text-sm font-bold text-black">Under Review</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={proposalStats.approved} duration={2400} />
                  </div>
                  <div className="text-sm font-bold text-black">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">
                    <AnimatedCounter targetValue={proposalStats.rejected} duration={2600} />
                  </div>
                  <div className="text-sm font-bold text-black">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveSection('users')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeSection === 'users'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveSection('proposals')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                activeSection === 'proposals'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Global Proposals
            </button>
          </div>

          {/* User Management Section */}
          {activeSection === 'users' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-1 flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    User Management
                  </h2>
                  <p className="text-gray-500 text-sm">Manage system users and their roles</p>
                </div>
                <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl text-sm transform hover:scale-105">
                  <UserPlus className="w-5 h-5" />
                  Create User
                </button>
              </div>

              {/* User Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <input
                    type="text"
                    placeholder="Search by Name, Email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="Investigator">Investigator</option>
                    <option value="Expert">Expert</option>
                    <option value="CMPDI">CMPDI</option>
                    <option value="TSSRC">TSSRC</option>
                    <option value="SSRC">SSRC</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
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

              {/* User Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Name</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Email</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Roles</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Organization</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className="border-b border-orange-100 hover:bg-orange-50 transition-colors duration-200"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-black">{user.fullName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-black">{user.email}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map(role => (
                              <span key={role} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-black">{user.organization}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Edit User">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors" title="Change Roles">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button className={`p-2 rounded-lg transition-colors ${
                              user.active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`} title={user.active ? 'Deactivate' : 'Activate'}>
                              {user.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Proposals Section */}
          {activeSection === 'proposals' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-1 flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    Global Proposals
                  </h2>
                  <p className="text-gray-500 text-sm">View and manage all proposals in the system</p>
                </div>
              </div>

              {/* Proposal Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <input
                    type="text"
                    placeholder="Search by ID, Title, or PI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Stages</option>
                    {uniqueStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
              </div>

              {/* Proposal Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">ID</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Title</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">PI</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Organization</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Current Stage</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-bold text-black">Created</th>
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
                            <span className="text-sm font-medium text-black">{proposal.title}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">{proposal.principalInvestigator}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">{proposal.organization}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                              {proposal.currentStage}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig?.className || 'bg-gray-100 text-gray-600'}`}>
                              {statusConfig?.label || proposal.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-black">{formatDate(proposal.createdAt)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <Link href={`/proposal/view/${proposal.id}`}>
                                <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="View">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <Link href={`/proposal/track/${proposal.id}`}>
                                <button className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors" title="View Timeline">
                                  <TrendingUp className="w-4 h-4" />
                                </button>
                              </Link>
                              <button className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors" title="Admin Override">
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
