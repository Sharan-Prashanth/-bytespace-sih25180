'use client';

import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingScreen from "../../components/LoadingScreen";
import Nav2 from "../Nav2";
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
  BarChart3,
  Grid3x3,
  List,
  Users
} from "lucide-react";

function InvestigatorDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSection, setActiveSection] = useState('my-proposals');
  const itemsPerPage = 10;

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

  const lastDraft = proposals.find(p => p.status === PROPOSAL_STATUS.DRAFT);

  const filteredProposals = proposals.filter(proposal => {
    if (activeSection === 'ongoing' && proposal.status !== PROPOSAL_STATUS.ONGOING) return false;
    if (activeSection === 'completed' && proposal.status !== PROPOSAL_STATUS.COMPLETED) return false;

    const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
    const matchesSearch = proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.proposalCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === 'all' || proposal.principalAgency === domainFilter;

    return matchesStatus && matchesSearch && matchesDomain;
  });

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setCurrentPage(1);
    if (section === 'ongoing') setFilterStatus(PROPOSAL_STATUS.ONGOING);
    else if (section === 'completed') setFilterStatus(PROPOSAL_STATUS.COMPLETED);
    else setFilterStatus('all');
  };

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueAgencies = [...new Set(proposals.map(p => p.principalAgency).filter(Boolean))];

  const stats = {
    total: proposals.length,
    ongoing: proposals.filter(p => p.status === PROPOSAL_STATUS.ONGOING).length,
    completed: proposals.filter(p => p.status === PROPOSAL_STATUS.COMPLETED).length,
  };

  const getSectionTitle = () => {
    const titles = {
      'my-proposals': 'My Proposals',
      'ongoing': 'Ongoing Proposals',
      'completed': 'Completed Proposals'
    };
    return titles[activeSection] || 'My Proposals';
  };

  const getStatusBadge = (status) => {
    let bgColor = 'bg-slate-100', textColor = 'text-slate-700';
    if (status === PROPOSAL_STATUS.ONGOING) {
      bgColor = 'bg-cyan-50'; textColor = 'text-cyan-600';
    } else if (status === PROPOSAL_STATUS.COMPLETED) {
      bgColor = 'bg-emerald-50'; textColor = 'text-emerald-600';
    } else if (status === PROPOSAL_STATUS.DRAFT) {
      bgColor = 'bg-slate-100'; textColor = 'text-slate-600';
    } else if (status?.includes('REJECT')) {
      bgColor = 'bg-red-50'; textColor = 'text-red-600';
    } else if (status?.includes('REVIEW')) {
      bgColor = 'bg-cyan-50'; textColor = 'text-cyan-600';
    }
    return { bgColor, textColor, label: STATUS_CONFIG[status]?.label || status };
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav2 />
      </div>

      <div className="pt-16">
        {/* Main Content */}
        <main className="w-full p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">{getSectionTitle()}</h1>
                <p className="text-slate-600 mb-6">Manage and track your research proposals</p>

                {/* Tab Navigation */}
                <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-fit">
                  {[
                    { id: 'my-proposals', label: 'All Proposals' },
                    { id: 'ongoing', label: 'Ongoing' },
                    { id: 'completed', label: 'Completed' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleSectionChange(tab.id)}
                      className={`
                        rounded-lg py-2 px-4 text-sm font-bold leading-5 transition-all
                        ${activeSection === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                {lastDraft && (
                  <Link href={`/proposal/create?draft=${lastDraft._id}`}>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Continue Draft
                    </button>
                  </Link>
                )}
                <Link href="/proposal/create">
                  <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2 ring-2 ring-amber-400/50">
                    <Plus className="w-5 h-5" />
                    New Proposal
                  </button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                >
                  <option value="all">All Categories</option>
                  <option value={PROPOSAL_STATUS.DRAFT}>Draft</option>
                  <option value={PROPOSAL_STATUS.CMPDI_REVIEW}>Under Review</option>
                  <option value={PROPOSAL_STATUS.ONGOING}>Ongoing</option>
                  <option value={PROPOSAL_STATUS.COMPLETED}>Completed</option>
                </select>
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                >
                  <option value="all">All Agencies</option>
                  {uniqueAgencies.map(agency => (
                    <option key={agency} value={agency}>{agency}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Proposals Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Proposal ID</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Title</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Stage Owner</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Submitted</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Last Updated</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProposals.length > 0 ? (
                      paginatedProposals.map((proposal) => {
                        const { bgColor, textColor, label } = getStatusBadge(proposal.status);

                        return (
                          <tr key={proposal._id} className="hover:bg-slate-50 transition-colors">
                            {/* Proposal ID */}
                            <td className="py-4 px-6">
                              <span className="text-sm font-medium text-slate-900">{proposal.proposalCode || 'N/A'}</span>
                            </td>

                            {/* Title */}
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-900 text-sm max-w-xs truncate">
                                {proposal.title}
                              </div>
                              <div className="text-xs text-slate-500">{proposal.principalAgency || 'N/A'}</div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${bgColor} ${textColor}`}>
                                {label}
                              </span>
                            </td>

                            {/* Stage Owner */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {user?.fullName?.charAt(0) || 'U'}
                                </div>
                                <span className="text-sm text-slate-700">{user?.fullName || 'User'}</span>
                              </div>
                            </td>

                            {/* Submitted */}
                            <td className="py-4 px-6 text-sm text-slate-700">
                              {proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>

                            {/* Last Updated */}
                            <td className="py-4 px-6 text-sm text-slate-700">
                              {proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                {proposal.status === PROPOSAL_STATUS.DRAFT ? (
                                  <Link href={`/proposal/create?draft=${proposal._id}`}>
                                    <button className="cursor-pointer px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5">
                                      <Edit className="w-3.5 h-3.5" />
                                      Continue
                                    </button>
                                  </Link>
                                ) : proposal.status === PROPOSAL_STATUS.COMPLETED ? (
                                  <Link href={`/proposal/view/${proposal._id}`}>
                                    <button className="cursor-pointer px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5">
                                      <Eye className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                  </Link>
                                ) : (
                                  <Link href={`/proposal/view/${proposal._id}`}>
                                    <button className="cursor-pointer px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5">
                                      <Eye className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                  </Link>
                                )}
                                <Link href={`/proposal/track/${proposal._id}`}>
                                  <button className="cursor-pointer p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Track Progress">
                                    <BarChart3 className="w-4 h-4" />
                                  </button>
                                </Link>
                                <Link href={`/proposal/collaborate/${proposal._id}`}>
                                  <button className="cursor-pointer p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Collaborate">
                                    <Users className="w-4 h-4" />
                                  </button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Proposals Found</h3>
                              <p className="text-slate-500 text-sm">
                                {filterStatus === 'all' && !searchQuery
                                  ? "You haven't created any proposals yet."
                                  : 'No proposals match your filters.'}
                              </p>
                            </div>
                            <Link href="/proposal/create">
                              <button className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Create New Proposal
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProposals.length > 0 ? (
                  paginatedProposals.map((proposal) => {
                    const { bgColor, textColor, label } = getStatusBadge(proposal.status);
                    return (
                      <div key={proposal._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between h-full group">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${bgColor} ${textColor}`}>
                              {label}
                            </span>
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                              <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2" title={proposal.title}>
                            {proposal.title}
                          </h3>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium text-slate-900">ID:</span>
                              <span>{proposal.proposalCode || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium text-slate-900">Agency:</span>
                              <span className="truncate">{proposal.principalAgency || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium text-slate-900">Owner:</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                  {user?.fullName?.charAt(0) || 'U'}
                                </div>
                                <span className="truncate">{user?.fullName || 'User'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Updated: {proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                          {proposal.status === PROPOSAL_STATUS.DRAFT ? (
                            <Link href={`/proposal/create?draft=${proposal._id}`} className="flex-1">
                              <button className="cursor-pointer w-full py-2 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                <Edit className="w-4 h-4" />
                                Continue
                              </button>
                            </Link>
                          ) : (
                            <Link href={`/proposal/view/${proposal._id}`} className="flex-1">
                              <button className="cursor-pointer w-full py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            </Link>
                          )}
                          <Link href={`/proposal/track/${proposal._id}`}>
                            <button className="cursor-pointer p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all border border-slate-200 hover:border-purple-200" title="Track">
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/proposal/collaborate/${proposal._id}`}>
                            <button className="cursor-pointer p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200 hover:border-indigo-200" title="Collaborate">
                              <Users className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Grid3x3 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Proposals Found</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      {filterStatus === 'all' && !searchQuery
                        ? "You haven't created any proposals yet."
                        : 'No proposals match your filters.'}
                    </p>
                    <Link href="/proposal/create">
                      <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create New Proposal
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {filteredProposals.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600">
                  {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProposals.length)} of {filteredProposals.length} records
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${currentPage === pageNum
                          ? 'bg-cyan-500 text-white'
                          : 'border border-slate-300 hover:bg-white'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
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
