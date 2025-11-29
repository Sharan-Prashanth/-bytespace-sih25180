'use client';

import {
    Calendar,
    DollarSign,
    FileText,
    LayoutGrid,
    List,
    Search,
    Eye
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProposalDetail from "../Proposals/ProposalDetail";
import apiClient from "../../../utils/api";

export default function ProposalsSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch proposals from API
    useEffect(() => {
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
        fetchProposals();
    }, []);

    // Handle URL query param for proposal ID
    useEffect(() => {
        if (router.query.proposalId && proposals.length > 0) {
            const proposal = proposals.find(p => p._id === router.query.proposalId || p.proposalCode === router.query.proposalId);
            if (proposal) setSelectedProposal(proposal);
        } else {
            setSelectedProposal(null);
        }
    }, [router.query.proposalId, proposals]);

    const handleProposalClick = (proposal) => {
        setSelectedProposal(proposal);
        // Shallow routing
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, proposalId: proposal._id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedProposal(null);
        const { proposalId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const handleViewProposal = (proposalId) => {
        router.push(`/proposal/view/${proposalId}`);
    };

    const filteredProposals = proposals.filter(p =>
        (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.createdBy?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.proposalCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.principalAgency?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Helper to format budget
    const formatBudget = (amount) => {
        if (!amount) return 'N/A';
        return `₹${Number(amount).toLocaleString('en-IN')}`;
    };

    // Helper to get status display
    const getStatusDisplay = (status) => {
        const statusMap = {
            'DRAFT': 'Draft',
            'SUBMITTED': 'Submitted',
            'CMPDI_REVIEW': 'CMPDI Review',
            'CMPDI_APPROVED': 'CMPDI Approved',
            'EXPERT_REVIEW': 'Expert Review',
            'TSSRC_REVIEW': 'TSSRC Review',
            'TSSRC_APPROVED': 'TSSRC Approved',
            'SSRC_REVIEW': 'SSRC Review',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        };
        return statusMap[status] || status;
    };

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': 
            case 'CMPDI_APPROVED':
            case 'TSSRC_APPROVED':
                return isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': 
                return isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100';
            case 'SUBMITTED':
            case 'CMPDI_REVIEW':
            case 'EXPERT_REVIEW':
            case 'TSSRC_REVIEW':
            case 'SSRC_REVIEW':
                return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100';
            case 'DRAFT':
                return isDark ? 'bg-slate-700/50 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200';
            default: 
                return isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'APPROVED': 
            case 'CMPDI_APPROVED':
            case 'TSSRC_APPROVED':
                return 'bg-emerald-500';
            case 'REJECTED': 
                return 'bg-red-500';
            case 'SUBMITTED':
            case 'CMPDI_REVIEW':
            case 'EXPERT_REVIEW':
            case 'TSSRC_REVIEW':
            case 'SSRC_REVIEW':
                return 'bg-blue-500';
            case 'DRAFT':
                return 'bg-slate-500';
            default: 
                return 'bg-amber-500';
        }
    };

    if (selectedProposal) {
        return <ProposalDetail proposal={selectedProposal} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Projects & Proposals</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Track and manage all research proposals and ongoing projects.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
                    <FileText size={18} />
                    <span>New Proposal</span>
                </button>
            </div>

            {/* Filters & View Toggle */}
            <div className={`${cardBg} p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row items-center gap-4`}>
                {/* Search Bar */}
                <div className="relative flex-1 group w-full">
                    <Search
                        size={18}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
                            ${isDark ? 'text-slate-500 group-focus-within:text-slate-300' : 'text-slate-400 group-focus-within:text-slate-600'}
                        `}
                    />
                    <input
                        type="text"
                        placeholder="Search proposals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border outline-none shadow-sm hover:shadow-md
                            ${isDarkest
                                ? 'bg-neutral-950 border-neutral-800 text-white placeholder-slate-600 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                                : isDark
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'}
                        `}
                    />
                </div>

                {/* View Toggle */}
                <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                        title="Table View"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'card'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                        title="Card View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'table' ? (
                // Table View
                <div className={`${cardBg} rounded-3xl shadow-sm border overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${borderColor}`}>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal Title</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Submitter</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Category</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Budget</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Date</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="p-6 text-center">
                                            <div className={`${subTextColor}`}>Loading proposals...</div>
                                        </td>
                                    </tr>
                                ) : filteredProposals.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-6 text-center">
                                            <div className={`${subTextColor}`}>No proposals found</div>
                                        </td>
                                    </tr>
                                ) : filteredProposals.map((proposal) => (
                                    <tr
                                        key={proposal._id}
                                        onClick={() => handleProposalClick(proposal)}
                                        className={`group transition-colors cursor-pointer ${hoverBg}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${textColor} line-clamp-1`}>{proposal.title}</div>
                                                    <div className={`text-xs ${subTextColor}`}>{proposal.proposalCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.createdBy?.fullName || proposal.projectLeader || 'N/A'}</div>
                                            <div className={`text-xs ${subTextColor}`}>{proposal.principalAgency || 'N/A'}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.fundingMethod || 'N/A'}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(proposal.status)}`}></div>
                                                {getStatusDisplay(proposal.status)}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatBudget(proposal.outlayLakhs * 100000)}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${subTextColor}`}>{formatDate(proposal.createdAt)}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewProposal(proposal._id);
                                                }}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                    isDark 
                                                        ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' 
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                }`}
                                                title="View Proposal"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className={`col-span-full text-center py-12 ${subTextColor}`}>Loading proposals...</div>
                    ) : filteredProposals.length === 0 ? (
                        <div className={`col-span-full text-center py-12 ${subTextColor}`}>No proposals found</div>
                    ) : filteredProposals.map((proposal) => (
                        <div
                            key={proposal._id}
                            onClick={() => handleProposalClick(proposal)}
                            className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <FileText size={24} />
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(proposal.status)}`}></div>
                                    {getStatusDisplay(proposal.status)}
                                </span>
                            </div>

                            <h3 className={`font-bold text-lg mb-2 line-clamp-2 h-14 ${textColor}`}>{proposal.title}</h3>

                            <div className="flex items-center gap-2 mb-6">
                                <span className={`text-xs font-medium px-2 py-1 rounded-md ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {proposal.fundingMethod || 'N/A'}
                                </span>
                                <span className={`text-xs font-medium ${subTextColor}`}>• {proposal.principalAgency || 'N/A'}</span>
                            </div>

                            <div className={`flex items-center justify-between pt-4 border-t mt-auto ${borderColor}`}>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                    <span className={`text-sm font-bold ${textColor}`}>{formatBudget(proposal.outlayLakhs * 100000)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className={subTextColor} />
                                        <span className={`text-xs font-medium ${subTextColor}`}>{formatDate(proposal.createdAt)}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewProposal(proposal._id);
                                        }}
                                        className={`p-2 rounded-lg transition-all ${
                                            isDark 
                                                ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' 
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                        title="View Proposal"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
