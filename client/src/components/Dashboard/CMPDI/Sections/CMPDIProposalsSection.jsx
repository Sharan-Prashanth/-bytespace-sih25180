'use client';

import {
    BarChart3,
    Eye,
    FileText,
    LayoutGrid,
    List,
    Search,
    Users,
    XCircle,
    Award,
    Clock,
    Send,
    ClipboardCheck,
    ChevronDown,
    MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import apiClient from "../../../../utils/api";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate } from "../../../../utils/statusConfig";

export default function CMPDIProposalsSection({ theme }) {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewSection, setViewSection] = useState('active');
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef(null);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    // Close more menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Categorize proposals for CMPDI view
    // Active: AI_EVALUATION_PENDING, CMPDI_REVIEW
    const activeProposals = proposals.filter(p => 
        ['AI_EVALUATION_PENDING', 'CMPDI_REVIEW'].includes(p.status)
    );
    
    // Expert Review: CMPDI_EXPERT_REVIEW
    const expertReviewProposals = proposals.filter(p => p.status === 'CMPDI_EXPERT_REVIEW');
    
    // Approved by CMPDI (Recommended for TSSRC): CMPDI_ACCEPTED, TSSRC_REVIEW
    const recommendedForTSSRC = proposals.filter(p => 
        ['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(p.status)
    );
    
    // TSSRC Approved (Recommended for SSRC): TSSRC_ACCEPTED, SSRC_REVIEW
    const recommendedForSSRC = proposals.filter(p => 
        ['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(p.status)
    );
    
    // Final Approved: SSRC_ACCEPTED
    const approvedProposals = proposals.filter(p => p.status === 'SSRC_ACCEPTED');
    
    // Rejected: CMPDI_REJECTED, TSSRC_REJECTED, SSRC_REJECTED, AI_REJECTED
    const rejectedProposals = proposals.filter(p => 
        ['AI_REJECTED', 'CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(p.status)
    );

    const getProposalsToFilter = () => {
        switch (viewSection) {
            case 'expertReview':
                return expertReviewProposals;
            case 'recommendedTSSRC':
                return recommendedForTSSRC;
            case 'recommendedSSRC':
                return recommendedForSSRC;
            case 'approved':
                return approvedProposals;
            case 'rejected':
                return rejectedProposals;
            default:
                return activeProposals;
        }
    };

    const filteredProposals = getProposalsToFilter().filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.projectLeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.principalAgency?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusOptions = () => {
        switch (viewSection) {
            case 'active':
                return [
                    { value: 'all', label: 'All Status' },
                    { value: 'AI_EVALUATION_PENDING', label: 'AI Evaluation Pending' },
                    { value: 'CMPDI_REVIEW', label: 'CMPDI Review' }
                ];
            case 'expertReview':
                return [
                    { value: 'all', label: 'All Status' },
                    { value: 'CMPDI_EXPERT_REVIEW', label: 'Expert Review' }
                ];
            case 'recommendedTSSRC':
                return [
                    { value: 'all', label: 'All Status' },
                    { value: 'CMPDI_ACCEPTED', label: 'CMPDI Accepted' },
                    { value: 'TSSRC_REVIEW', label: 'TSSRC Review' }
                ];
            case 'recommendedSSRC':
                return [
                    { value: 'all', label: 'All Status' },
                    { value: 'TSSRC_ACCEPTED', label: 'TSSRC Accepted' },
                    { value: 'SSRC_REVIEW', label: 'SSRC Review' }
                ];
            case 'rejected':
                return [
                    { value: 'all', label: 'All Status' },
                    { value: 'AI_REJECTED', label: 'AI Rejected' },
                    { value: 'CMPDI_REJECTED', label: 'CMPDI Rejected' },
                    { value: 'TSSRC_REJECTED', label: 'TSSRC Rejected' },
                    { value: 'SSRC_REJECTED', label: 'SSRC Rejected' }
                ];
            default:
                return [{ value: 'all', label: 'All Status' }];
        }
    };

    const renderProposalRow = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const isExpertReviewSection = viewSection === 'expertReview';
        
        return (
            <tr key={proposal._id} className={`group transition-colors ${hoverBg}`}>
                <td className="p-3 px-4">
                    <span className={`text-sm font-bold ${textColor}`}>{proposal.proposalCode || '-'}</span>
                </td>
                <td className="p-3 px-4">
                    <div className={`font-bold text-sm ${textColor} line-clamp-1`}>{proposal.title}</div>
                    <div className={`text-xs ${subTextColor}`}>{proposal.principalAgency}</div>
                </td>
                <td className="p-3 px-4">
                    <span className={`text-sm ${textColor}`}>{proposal.projectLeader || '-'}</span>
                </td>
                <td className="p-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </td>
                {isExpertReviewSection && (
                    <td className="p-3 px-4">
                        <div className="space-y-1">
                            {proposal.assignedReviewers?.length > 0 ? (
                                proposal.assignedReviewers.map((reviewer, idx) => (
                                    <div key={idx} className={`text-xs ${subTextColor}`}>
                                        <span className={textColor}>{reviewer.reviewer?.fullName || 'Expert'}</span>
                                        <span className="ml-2">({formatDate(reviewer.assignedAt)})</span>
                                    </div>
                                ))
                            ) : (
                                <span className={`text-xs ${subTextColor}`}>No experts assigned</span>
                            )}
                        </div>
                    </td>
                )}
                <td className="p-3 px-4">
                    <span className={`text-sm font-medium ${subTextColor}`}>{formatDate(proposal.createdAt)}</span>
                </td>
                <td className="p-3 px-4">
                    <span className={`text-sm font-medium ${subTextColor}`}>{formatDate(proposal.updatedAt)}</span>
                </td>
                <td className="p-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                        <Link href={`/proposal/collaborate/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`} title="Collaborate">
                                <Users size={16} />
                            </button>
                        </Link>
                        <Link href={`/proposal/view/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'text-emerald-400 hover:bg-emerald-900/20' : 'text-emerald-600 hover:bg-emerald-50'}`} title="View">
                                <Eye size={16} />
                            </button>
                        </Link>
                        <Link href={`/proposal/track/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'text-purple-400 hover:bg-purple-900/20' : 'text-purple-600 hover:bg-purple-50'}`} title="Track Progress">
                                <BarChart3 size={16} />
                            </button>
                        </Link>
                        <Link href={`/proposal/review/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Review">
                                <ClipboardCheck size={16} />
                            </button>
                        </Link>
                    </div>
                </td>
            </tr>
        );
    };

    const renderProposalCard = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const isRejected = ['AI_REJECTED', 'CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(proposal.status);
        const isApproved = proposal.status === 'SSRC_ACCEPTED';
        const isExpertReview = proposal.status === 'CMPDI_EXPERT_REVIEW';

        return (
            <div key={proposal._id} className={`${cardBg} p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isRejected 
                            ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600') 
                            : isApproved
                                ? (isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600')
                                : isExpertReview
                                    ? (isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                    : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                    }`}>
                        {isRejected ? <XCircle size={20} /> : isApproved ? <Award size={20} /> : isExpertReview ? <Users size={20} /> : <FileText size={20} />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </div>

                <h3 className={`font-bold text-sm mb-1 ${textColor} line-clamp-2`}>{proposal.title}</h3>
                <p className={`text-xs mb-1 ${subTextColor}`}>{proposal.principalAgency}</p>
                <p className={`text-xs mb-2 ${subTextColor}`}>PI: {proposal.projectLeader || '-'}</p>

                {/* Expert Review Info */}
                {isExpertReview && proposal.assignedReviewers?.length > 0 && (
                    <div className={`text-[10px] mb-2 p-2 rounded-lg ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                        <p className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Assigned Experts:</p>
                        {proposal.assignedReviewers.map((reviewer, idx) => (
                            <p key={idx} className={subTextColor}>
                                {reviewer.reviewer?.fullName || 'Expert'} - {formatDate(reviewer.assignedAt)}
                            </p>
                        ))}
                    </div>
                )}

                <div className={`text-[10px] mb-2 space-y-0.5 ${subTextColor}`}>
                    <p>Submitted: {formatDate(proposal.createdAt)}</p>
                    <p>Updated: {formatDate(proposal.updatedAt)}</p>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t mt-auto ${borderColor}`}>
                    <span className={`text-[10px] font-bold ${textColor}`}>{proposal.proposalCode || 'No ID'}</span>
                    <div className="flex gap-1">
                        <Link href={`/proposal/collaborate/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`} title="Collaborate">
                                <Users size={14} />
                            </button>
                        </Link>
                        <Link href={`/proposal/view/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-slate-100 text-emerald-500'}`} title="View">
                                <Eye size={14} />
                            </button>
                        </Link>
                        <Link href={`/proposal/track/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-purple-400' : 'hover:bg-slate-100 text-purple-500'}`} title="Track">
                                <BarChart3 size={14} />
                            </button>
                        </Link>
                        <Link href={`/proposal/review/${proposal._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-orange-400' : 'hover:bg-slate-100 text-orange-500'}`} title="Review">
                                <ClipboardCheck size={14} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    const getSectionIcon = (section) => {
        switch (section) {
            case 'expertReview': return <Users size={14} />;
            case 'recommendedTSSRC': return <Send size={14} />;
            case 'recommendedSSRC': return <Send size={14} />;
            case 'approved': return <Award size={14} />;
            case 'rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className={`w-8 h-8 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className={`text-xl font-bold ${textColor}`}>All Proposals</h2>
                    <p className={`${subTextColor} text-sm`}>Manage and review research proposals.</p>
                </div>
            </div>

            {/* Filters & View Toggle */}
            <div className={`${cardBg} p-3 rounded-xl shadow-sm border flex flex-col sm:flex-row items-center gap-3`}>
                {/* Section Toggle */}
                <div className={`flex items-center p-1 rounded-xl border flex-wrap ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => { setViewSection('active'); setFilterStatus('all'); }}
                        className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'active'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                    >
                        <Clock size={14} />
                        Active ({activeProposals.length})
                    </button>
                    <button
                        onClick={() => { setViewSection('expertReview'); setFilterStatus('all'); }}
                        className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'expertReview'
                            ? (isDark ? 'bg-indigo-900/50 text-indigo-400 shadow-sm' : 'bg-indigo-50 text-indigo-600 shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                    >
                        <Users size={14} />
                        Expert Review ({expertReviewProposals.length})
                    </button>
                    <button
                        onClick={() => { setViewSection('rejected'); setFilterStatus('all'); }}
                        className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'rejected'
                            ? (isDark ? 'bg-red-900/50 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                    >
                        <XCircle size={14} />
                        Rejected ({rejectedProposals.length})
                    </button>
                    
                    {/* More dropdown for TSSRC, SSRC, Approved */}
                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${
                                ['recommendedTSSRC', 'recommendedSSRC', 'approved'].includes(viewSection)
                                    ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm border')
                                    : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')
                            }`}
                        >
                            <MoreHorizontal size={14} />
                            More
                            <ChevronDown size={12} className={`transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {moreMenuOpen && (
                            <div className={`absolute top-full left-0 mt-1 min-w-48 rounded-xl shadow-lg border z-50 ${cardBg}`}>
                                <div className="p-1">
                                    <button
                                        onClick={() => { setViewSection('recommendedTSSRC'); setFilterStatus('all'); setMoreMenuOpen(false); }}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                                            viewSection === 'recommendedTSSRC'
                                                ? (isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-50 text-cyan-600')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-black hover:bg-slate-50')
                                        }`}
                                    >
                                        <Send size={14} />
                                        TSSRC Review ({recommendedForTSSRC.length})
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('recommendedSSRC'); setFilterStatus('all'); setMoreMenuOpen(false); }}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                                            viewSection === 'recommendedSSRC'
                                                ? (isDark ? 'bg-violet-900/50 text-violet-400' : 'bg-violet-50 text-violet-600')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-black hover:bg-slate-50')
                                        }`}
                                    >
                                        <Send size={14} />
                                        SSRC Review ({recommendedForSSRC.length})
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('approved'); setFilterStatus('all'); setMoreMenuOpen(false); }}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                                            viewSection === 'approved'
                                                ? (isDark ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-50 text-teal-600')
                                                : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-black hover:bg-slate-50')
                                        }`}
                                    >
                                        <Award size={14} />
                                        Approved ({approvedProposals.length})
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 group w-full">
                    <Search
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300
                            ${isDark ? 'text-slate-400 group-focus-within:text-slate-300' : 'text-black group-focus-within:text-black'}
                        `}
                    />
                    <input
                        type="text"
                        placeholder="Search proposals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border outline-none shadow-sm hover:shadow-md cursor-pointer ${inputBg} ${isDark ? 'text-white' : 'text-black'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                >
                    {getStatusOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* View Toggle */}
                <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        title="Table View"
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'card'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        title="Card View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* Proposals Content Area */}
            {filteredProposals.length > 0 ? (
                viewMode === 'table' ? (
                    <div className={`${cardBg} rounded-xl shadow-sm border overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${borderColor}`}>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal ID</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Title</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Project Leader</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                        {viewSection === 'expertReview' && (
                                            <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Assigned Experts</th>
                                        )}
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Submitted</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Last Updated</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                    {filteredProposals.map((proposal) => renderProposalRow(proposal))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProposals.map((proposal) => renderProposalCard(proposal))}
                    </div>
                )
            ) : (
                <div className={`${cardBg} rounded-xl p-8 text-center border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black'}`}>
                        {getSectionIcon(viewSection)}
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${textColor}`}>No Proposals Found</h3>
                    <p className={`text-sm mb-4 ${subTextColor}`}>
                        {searchTerm || filterStatus !== 'all'
                            ? "Try adjusting your filters."
                            : "No proposals in this category."}
                    </p>
                </div>
            )}
        </div>
    );
}
