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
    ClipboardCheck,
    Rocket,
    Shield,
    Filter,
    Zap,
    Send,
    ThumbsUp,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import apiClient from "../../../../utils/api";
import { STATUS_CONFIG, PROPOSAL_STATUS, formatDate } from "../../../../utils/statusConfig";

export default function AdminProposalsSection({ theme, initialSearchTerm = '' }) {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [viewMode, setViewMode] = useState("table");
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewSection, setViewSection] = useState('all');
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const filterMenuRef = useRef(null);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    // Update search term when initialSearchTerm changes
    useEffect(() => {
        if (initialSearchTerm) {
            setSearchTerm(initialSearchTerm);
        }
    }, [initialSearchTerm]);

    // Close filter menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setFilterMenuOpen(false);
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
            // Filter out drafts - admin sees everything except drafts
            const nonDraftProposals = proposalData.filter(p => p.status !== 'DRAFT');
            setProposals(Array.isArray(nonDraftProposals) ? nonDraftProposals : []);
        } catch (error) {
            console.error("Error fetching proposals:", error);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    // Categorize proposals by stage
    const aiEvaluationProposals = proposals.filter(p => 
        ['SUBMITTED', 'AI_EVALUATION'].includes(p.status)
    );
    
    const cmpdiReviewProposals = proposals.filter(p => 
        ['CMPDI_REVIEW', 'EXPERT_REVIEW'].includes(p.status)
    );
    
    const tssrcReviewProposals = proposals.filter(p => 
        ['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(p.status)
    );
    
    const ssrcReviewProposals = proposals.filter(p => 
        ['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(p.status)
    );
    
    const approvedProposals = proposals.filter(p => p.status === 'SSRC_ACCEPTED');
    
    const rejectedProposals = proposals.filter(p => 
        ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(p.status)
    );

    const getProposalsToFilter = () => {
        switch (viewSection) {
            case 'ai_evaluation':
                return aiEvaluationProposals;
            case 'cmpdi':
                return cmpdiReviewProposals;
            case 'tssrc':
                return tssrcReviewProposals;
            case 'ssrc':
                return ssrcReviewProposals;
            case 'approved':
                return approvedProposals;
            case 'rejected':
                return rejectedProposals;
            default:
                return proposals;
        }
    };

    const filteredProposals = getProposalsToFilter().filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.projectLeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.principalAgency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.createdBy?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusOptions = () => {
        const baseOptions = [{ value: 'all', label: 'All Status' }];
        
        switch (viewSection) {
            case 'ai_evaluation':
                return [
                    ...baseOptions,
                    { value: 'SUBMITTED', label: 'Submitted' },
                    { value: 'AI_EVALUATION', label: 'AI Evaluation' }
                ];
            case 'cmpdi':
                return [
                    ...baseOptions,
                    { value: 'CMPDI_REVIEW', label: 'CMPDI Review' },
                    { value: 'EXPERT_REVIEW', label: 'Expert Review' }
                ];
            case 'tssrc':
                return [
                    ...baseOptions,
                    { value: 'CMPDI_ACCEPTED', label: 'Sent to TSSRC' },
                    { value: 'TSSRC_REVIEW', label: 'TSSRC Review' }
                ];
            case 'ssrc':
                return [
                    ...baseOptions,
                    { value: 'TSSRC_ACCEPTED', label: 'Sent to SSRC' },
                    { value: 'SSRC_REVIEW', label: 'SSRC Review' }
                ];
            case 'rejected':
                return [
                    ...baseOptions,
                    { value: 'CMPDI_REJECTED', label: 'CMPDI Rejected' },
                    { value: 'TSSRC_REJECTED', label: 'TSSRC Rejected' },
                    { value: 'SSRC_REJECTED', label: 'SSRC Rejected' }
                ];
            default:
                return [
                    ...baseOptions,
                    ...Object.entries(PROPOSAL_STATUS)
                        .filter(([key]) => key !== 'DRAFT')
                        .map(([key, value]) => ({
                            value: key,
                            label: STATUS_CONFIG[key]?.label || value
                        }))
                ];
        }
    };

    const getStageBadge = (status) => {
        if (['SUBMITTED', 'AI_EVALUATION'].includes(status)) {
            return { label: 'AI Stage', color: isDark ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200' };
        }
        if (['CMPDI_REVIEW', 'EXPERT_REVIEW'].includes(status)) {
            return { label: 'CMPDI Stage', color: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        if (['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(status)) {
            return { label: 'TSSRC Stage', color: isDark ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200' };
        }
        if (['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(status)) {
            return { label: 'SSRC Stage', color: isDark ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200' };
        }
        if (status === 'SSRC_ACCEPTED') {
            return { label: 'Funded', color: isDark ? 'bg-teal-900/30 text-teal-400 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200' };
        }
        if (['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(status)) {
            return { label: 'Rejected', color: isDark ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200' };
        }
        return { label: 'Unknown', color: isDark ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200' };
    };

    const renderProposalRow = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const stageBadge = getStageBadge(proposal.status);
        
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
                    <span className={`text-sm ${textColor}`}>{proposal.projectLeader || proposal.createdBy?.fullName || '-'}</span>
                </td>
                <td className="p-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageBadge.color}`}>
                        {stageBadge.label}
                    </span>
                </td>
                <td className="p-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </td>
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
        const stageBadge = getStageBadge(proposal.status);
        const isRejected = ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(proposal.status);
        const isApproved = proposal.status === 'SSRC_ACCEPTED';

        const getStageIcon = () => {
            if (isRejected) return <XCircle size={20} />;
            if (isApproved) return <Rocket size={20} />;
            if (['SUBMITTED', 'AI_EVALUATION'].includes(proposal.status)) return <Zap size={20} />;
            if (['CMPDI_REVIEW', 'EXPERT_REVIEW'].includes(proposal.status)) return <Shield size={20} />;
            if (['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(proposal.status)) return <Send size={20} />;
            if (['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(proposal.status)) return <ThumbsUp size={20} />;
            return <FileText size={20} />;
        };

        const getIconColor = () => {
            if (isRejected) return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
            if (isApproved) return isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600';
            if (['SUBMITTED', 'AI_EVALUATION'].includes(proposal.status)) return isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600';
            if (['CMPDI_REVIEW', 'EXPERT_REVIEW'].includes(proposal.status)) return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
            if (['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(proposal.status)) return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600';
            if (['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(proposal.status)) return isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600';
            return isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600';
        };

        return (
            <div key={proposal._id} className={`${cardBg} p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconColor()}`}>
                        {getStageIcon()}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageBadge.color}`}>
                            {stageBadge.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                            {statusConfig?.label || proposal.status}
                        </span>
                    </div>
                </div>

                <h3 className={`font-bold text-sm mb-1 ${textColor} line-clamp-2`}>{proposal.title}</h3>
                <p className={`text-xs mb-1 ${subTextColor}`}>{proposal.principalAgency}</p>
                <p className={`text-xs mb-2 ${subTextColor}`}>PI: {proposal.projectLeader || proposal.createdBy?.fullName || '-'}</p>

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className={`w-8 h-8 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>All Proposals</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Complete oversight of all proposals across all stages.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${isDark ? 'bg-violet-900/30 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
                    <Shield size={16} />
                    Super Admin Access
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className={`${cardBg} p-4 rounded-2xl shadow-sm border`}>
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                    {/* Large Search Bar */}
                    <div className="relative flex-1 group">
                        <Search
                            size={20}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
                                ${isDark ? 'text-slate-400 group-focus-within:text-slate-200' : 'text-black group-focus-within:text-black'}
                            `}
                        />
                        <input
                            type="text"
                            placeholder="Search by title, proposal code, investigator, or agency..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 text-base font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative" ref={filterMenuRef}>
                        <button
                            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                            className={`flex items-center gap-2 px-4 py-4 rounded-xl border font-bold text-sm transition-all ${inputBg} ${isDark ? 'text-white hover:bg-slate-800' : 'text-black hover:bg-slate-50'}`}
                        >
                            <Filter size={18} />
                            <span className="hidden sm:inline">
                                {viewSection === 'all' ? 'All Proposals' : 
                                 viewSection === 'ai_evaluation' ? 'AI Evaluation' :
                                 viewSection === 'cmpdi' ? 'CMPDI Review' :
                                 viewSection === 'tssrc' ? 'TSSRC Review' :
                                 viewSection === 'ssrc' ? 'SSRC Review' :
                                 viewSection === 'approved' ? 'Funded' : 'Rejected'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-black'}`}>
                                {filteredProposals.length}
                            </span>
                            <ChevronDown size={16} className={`transition-transform ${filterMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {filterMenuOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border z-50 overflow-hidden ${cardBg}`}>
                                <div className="p-2">
                                    <button
                                        onClick={() => { setViewSection('all'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'all' ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-black') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Filter size={16} />
                                            All Proposals
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-black'}`}>{proposals.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('ai_evaluation'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'ai_evaluation' ? (isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-50 text-purple-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} />
                                            AI Evaluation
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>{aiEvaluationProposals.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('cmpdi'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'cmpdi' ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield size={16} />
                                            CMPDI Review
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>{cmpdiReviewProposals.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('tssrc'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'tssrc' ? (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-50 text-amber-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Send size={16} />
                                            TSSRC Review
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>{tssrcReviewProposals.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('ssrc'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'ssrc' ? (isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp size={16} />
                                            SSRC Review
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>{ssrcReviewProposals.length}</span>
                                    </button>
                                    <div className={`my-2 border-t ${borderColor}`}></div>
                                    <button
                                        onClick={() => { setViewSection('approved'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'approved' ? (isDark ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-50 text-teal-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Rocket size={16} />
                                            Funded
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>{approvedProposals.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setViewSection('rejected'); setFilterStatus('all'); setFilterMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${viewSection === 'rejected' ? (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-black hover:bg-slate-50')}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <XCircle size={16} />
                                            Rejected
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'}`}>{rejectedProposals.length}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'table'
                                ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-3 rounded-lg transition-all ${viewMode === 'card'
                                ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                            title="Card View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
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
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Investigator</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Stage</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
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
                        <FileText size={32} />
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
