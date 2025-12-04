'use client';

import {
    BarChart3,
    Edit,
    Eye,
    FileText,
    LayoutGrid,
    List,
    Plus,
    Search,
    Users,
    XCircle,
    Award,
    Trash2,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate, isRejected, canModifyProposal, isSSRCAccepted } from "../../../../utils/statusConfig";
import apiClient from "../../../../utils/api";

export default function UserProposalsSection({ proposals, theme, onProposalDeleted }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewSection, setViewSection] = useState('active'); // 'active' | 'approved' | 'rejected'
    
    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState(1); // 1 = first confirmation, 2 = final warning
    const [proposalToDelete, setProposalToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    // Separate proposals into three categories
    const rejectedProposals = proposals.filter(p => isRejected(p.status));
    const approvedProposals = proposals.filter(p => isSSRCAccepted(p.status));
    const activeProposals = proposals.filter(p => !isRejected(p.status) && !isSSRCAccepted(p.status));

    // Get proposals to filter based on selected section
    const getProposalsToFilter = () => {
        switch (viewSection) {
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
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Find last draft
    const lastDraft = [...proposals]
        .filter(p => p.status === PROPOSAL_STATUS.DRAFT || p.status === PROPOSAL_STATUS.AI_REJECTED)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    // Delete handlers
    const handleDeleteClick = (proposal) => {
        setProposalToDelete(proposal);
        setDeleteConfirmStep(1);
        setDeleteError(null);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmStep === 1) {
            // Move to final warning step
            setDeleteConfirmStep(2);
        } else {
            // Execute delete
            executeDelete();
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setDeleteConfirmStep(1);
        setProposalToDelete(null);
        setDeleteError(null);
    };

    const executeDelete = async () => {
        if (!proposalToDelete) return;
        
        setIsDeleting(true);
        setDeleteError(null);
        
        try {
            await apiClient.delete(`/api/proposals/${proposalToDelete._id}`);
            
            // Close modal
            setDeleteModalOpen(false);
            setDeleteConfirmStep(1);
            setProposalToDelete(null);
            
            // Notify parent to refresh proposals list
            if (onProposalDeleted) {
                onProposalDeleted(proposalToDelete._id);
            }
        } catch (err) {
            console.error('Failed to delete proposal:', err);
            setDeleteError(err.response?.data?.message || 'Failed to delete proposal. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Check if proposal is a draft (can be deleted)
    const isDraftProposal = (status) => status === PROPOSAL_STATUS.DRAFT;

    // Render proposal row for table view
    const renderProposalRow = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const canEdit = canModifyProposal(proposal.status);
        const isRejectedSection = viewSection === 'rejected';
        const isApprovedSection = viewSection === 'approved';
        const isDraft = isDraftProposal(proposal.status);
        
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </td>
                <td className="p-3 px-4">
                    <span className={`text-sm font-medium ${subTextColor}`}>
                        {proposal.status !== PROPOSAL_STATUS.DRAFT ? formatDate(proposal.createdAt) : '-'}
                    </span>
                </td>
                <td className="p-3 px-4">
                    <span className={`text-sm font-medium ${subTextColor}`}>{formatDate(proposal.updatedAt)}</span>
                </td>
                <td className="p-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                        {/* For rejected proposals: only View and Track (AI Rejected can edit) */}
                        {isRejectedSection ? (
                            <>
                                {/* AI Rejected can be edited in create page */}
                                {proposal.status === PROPOSAL_STATUS.AI_REJECTED && (
                                    <Link href={`/proposal/create?draft=${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Edit & Resubmit">
                                            <Edit size={16} />
                                        </button>
                                    </Link>
                                )}
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
                            </>
                        ) : isApprovedSection ? (
                            /* For SSRC Accepted proposals: only View and Track (no collaborate) */
                            <>
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
                            </>
                        ) : (
                            <>
                                {/* Active proposals: Edit/Collaborate, View, Track/Delete */}
                                {canEdit ? (
                                    <Link href={`/proposal/create?draft=${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Edit Draft">
                                            <Edit size={16} />
                                        </button>
                                    </Link>
                                ) : (
                                    <Link href={`/proposal/collaborate/${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`} title="Collaborate">
                                            <Edit size={16} />
                                        </button>
                                    </Link>
                                )}
                                <Link href={`/proposal/view/${proposal._id}`}>
                                    <button className={`p-1.5 rounded-lg ${isDark ? 'text-emerald-400 hover:bg-emerald-900/20' : 'text-emerald-600 hover:bg-emerald-50'}`} title="View">
                                        <Eye size={16} />
                                    </button>
                                </Link>
                                {/* For draft proposals: show Delete instead of Track */}
                                {isDraft ? (
                                    <button 
                                        onClick={() => handleDeleteClick(proposal)}
                                        className={`p-1.5 rounded-lg ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`} 
                                        title="Delete Draft"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                ) : (
                                    <Link href={`/proposal/track/${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'text-purple-400 hover:bg-purple-900/20' : 'text-purple-600 hover:bg-purple-50'}`} title="Track Progress">
                                            <BarChart3 size={16} />
                                        </button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    // Render proposal card for card view
    const renderProposalCard = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const canEdit = canModifyProposal(proposal.status);
        const isRejectedProposal = isRejected(proposal.status);
        const isApprovedProposal = isSSRCAccepted(proposal.status);
        const isAIRejected = proposal.status === PROPOSAL_STATUS.AI_REJECTED;
        const isDraft = isDraftProposal(proposal.status);
        
        return (
            <div key={proposal._id} className={`${cardBg} p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isRejectedProposal 
                            ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600') 
                            : isApprovedProposal
                                ? (isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600')
                                : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                    }`}>
                        {isRejectedProposal ? <XCircle size={20} /> : isApprovedProposal ? <Award size={20} /> : <FileText size={20} />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </div>

                <h3 className={`font-bold text-sm mb-1 ${textColor} line-clamp-2`}>{proposal.title}</h3>
                <p className={`text-xs mb-2 ${subTextColor}`}>{proposal.principalAgency}</p>
                
                {/* Timestamps */}
                <div className={`text-[10px] mb-2 space-y-0.5 ${subTextColor}`}>
                    {proposal.status !== PROPOSAL_STATUS.DRAFT && (
                        <p>Submitted: {formatDate(proposal.createdAt)}</p>
                    )}
                    <p>Updated: {formatDate(proposal.updatedAt)}</p>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t mt-auto ${borderColor}`}>
                    <span className={`text-[10px] font-bold ${textColor}`}>{proposal.proposalCode || 'No ID'}</span>
                    <div className="flex gap-1">
                        {/* For rejected proposals */}
                        {isRejectedProposal ? (
                            <>
                                {isAIRejected && (
                                    <Link href={`/proposal/create?draft=${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-orange-400' : 'hover:bg-slate-100 text-orange-500'}`} title="Edit & Resubmit">
                                            <Edit size={14} />
                                        </button>
                                    </Link>
                                )}
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
                            </>
                        ) : isApprovedProposal ? (
                            /* For SSRC Accepted proposals: only View and Track */
                            <>
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
                            </>
                        ) : (
                            /* For active proposals */
                            <>
                                {canEdit ? (
                                    <Link href={`/proposal/create?draft=${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-orange-400' : 'hover:bg-slate-100 text-orange-500'}`} title="Edit Draft">
                                            <Edit size={14} />
                                        </button>
                                    </Link>
                                ) : (
                                    <Link href={`/proposal/collaborate/${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`} title="Collaborate">
                                            <Users size={14} />
                                        </button>
                                    </Link>
                                )}
                                <Link href={`/proposal/view/${proposal._id}`}>
                                    <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-slate-100 text-emerald-500'}`} title="View">
                                        <Eye size={14} />
                                    </button>
                                </Link>
                                {/* For draft proposals: show Delete instead of Track */}
                                {isDraft ? (
                                    <button 
                                        onClick={() => handleDeleteClick(proposal)}
                                        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-slate-100 text-red-500'}`} 
                                        title="Delete Draft"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                ) : (
                                    <Link href={`/proposal/track/${proposal._id}`}>
                                        <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-purple-400' : 'hover:bg-slate-100 text-purple-500'}`} title="Track">
                                            <BarChart3 size={14} />
                                        </button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className={`text-xl font-bold ${textColor}`}>My Proposals</h2>
                    <p className={`${subTextColor} text-sm`}>Manage and track your research submissions.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {lastDraft && (
                        <Link href={`/proposal/create?draft=${lastDraft._id}`}>
                            <button className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold text-sm border ${isDark ? 'bg-blue-900/20 text-blue-400 border-blue-900/50 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
                                <Edit size={16} />
                                <span>Continue Draft</span>
                            </button>
                        </Link>
                    )}
                    <Link href="/proposal/create">
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
                            <Plus size={16} />
                            <span>New Proposal</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters & View Toggle */}
            <div className={`${cardBg} p-3 rounded-xl shadow-sm border flex flex-col sm:flex-row items-center gap-3`}>
                {/* Section Toggle (Active/Approved/Rejected) */}
                {(approvedProposals.length > 0 || rejectedProposals.length > 0) && (
                    <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setViewSection('active')}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${viewSection === 'active'
                                ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        >
                            Active ({activeProposals.length})
                        </button>
                        {approvedProposals.length > 0 && (
                            <button
                                onClick={() => setViewSection('approved')}
                                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'approved'
                                    ? (isDark ? 'bg-teal-900/50 text-teal-400 shadow-sm' : 'bg-teal-50 text-teal-600 shadow-sm')
                                    : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                            >
                                <Award size={14} />
                                Approved ({approvedProposals.length})
                            </button>
                        )}
                        {rejectedProposals.length > 0 && (
                            <button
                                onClick={() => setViewSection('rejected')}
                                className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'rejected'
                                    ? (isDark ? 'bg-red-900/50 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm')
                                    : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                            >
                                <XCircle size={14} />
                                Rejected ({rejectedProposals.length})
                            </button>
                        )}
                    </div>
                )}
                
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

                {/* Status Filter - only show for active proposals */}
                {viewSection === 'active' && (
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border outline-none shadow-sm hover:shadow-md cursor-pointer ${inputBg} ${isDark ? 'text-white' : 'text-black'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    >
                        <option value="all">All Status</option>
                        <option value={PROPOSAL_STATUS.DRAFT}>Draft</option>
                        <option value={PROPOSAL_STATUS.AI_EVALUATION_PENDING}>AI Evaluation Pending</option>
                        <option value={PROPOSAL_STATUS.CMPDI_REVIEW}>CMPDI Review</option>
                        <option value={PROPOSAL_STATUS.CMPDI_EXPERT_REVIEW}>Expert Review</option>
                        <option value={PROPOSAL_STATUS.CMPDI_ACCEPTED}>CMPDI Accepted</option>
                        <option value={PROPOSAL_STATUS.TSSRC_REVIEW}>TSSRC Review</option>
                        <option value={PROPOSAL_STATUS.TSSRC_ACCEPTED}>TSSRC Accepted</option>
                        <option value={PROPOSAL_STATUS.SSRC_REVIEW}>SSRC Review</option>
                    </select>
                )}

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

            {/* Active Proposals Content Area */}
            {filteredProposals.length > 0 ? (
                viewMode === 'table' ? (
                    // Table View
                    <div className={`${cardBg} rounded-xl shadow-sm border overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${borderColor}`}>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal ID</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Title</th>
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
                    // Card View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProposals.map((proposal) => renderProposalCard(proposal))}
                    </div>
                )
            ) : (
                // Empty State
                <div className={`${cardBg} rounded-xl p-8 text-center border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        viewSection === 'rejected' 
                            ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-400')
                            : viewSection === 'approved'
                                ? (isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-500')
                                : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black')
                    }`}>
                        {viewSection === 'rejected' ? <XCircle size={32} /> : viewSection === 'approved' ? <Award size={32} /> : <FileText size={32} />}
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${textColor}`}>
                        {viewSection === 'rejected' 
                            ? 'No Rejected Proposals' 
                            : viewSection === 'approved'
                                ? 'No Approved Proposals'
                                : 'No Proposals Found'}
                    </h3>
                    <p className={`text-sm mb-4 ${subTextColor}`}>
                        {searchTerm || filterStatus !== 'all' 
                            ? "Try adjusting your filters." 
                            : viewSection === 'rejected' 
                                ? "You don't have any rejected proposals."
                                : viewSection === 'approved'
                                    ? "You don't have any SSRC approved proposals yet."
                                    : "Start by creating your first research proposal."}
                    </p>
                    {viewSection === 'active' && (
                        <Link href="/proposal/create">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                                Create Proposal
                            </button>
                        </Link>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && proposalToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={handleDeleteCancel} />
                    
                    <div className={`relative ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden`}>
                        {/* Header */}
                        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    deleteConfirmStep === 1 
                                        ? (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')
                                        : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')
                                }`}>
                                    {deleteConfirmStep === 1 ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${textColor}`}>
                                        {deleteConfirmStep === 1 ? 'Delete Draft Proposal' : 'Final Warning'}
                                    </h3>
                                    <p className={`text-sm ${subTextColor}`}>
                                        {proposalToDelete.proposalCode || 'Draft Proposal'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {deleteConfirmStep === 1 ? (
                                <div className="space-y-3">
                                    <p className={`text-sm ${textColor}`}>
                                        Are you sure you want to delete this draft proposal?
                                    </p>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                        <p className={`text-sm font-medium ${textColor}`}>
                                            {proposalToDelete.title || 'Untitled Proposal'}
                                        </p>
                                        {proposalToDelete.principalAgency && (
                                            <p className={`text-xs mt-1 ${subTextColor}`}>
                                                {proposalToDelete.principalAgency}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                            <div>
                                                <p className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                                                    This action cannot be undone
                                                </p>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                                                    The draft proposal and all its data will be permanently deleted from the system.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={`text-sm ${textColor}`}>
                                        Click "Delete Permanently" to confirm deletion.
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {deleteError && (
                                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-900/50' : 'bg-red-50 border border-red-200'}`}>
                                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{deleteError}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} flex justify-end gap-2`}>
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isDark 
                                        ? 'text-slate-300 hover:bg-slate-700' 
                                        : 'text-black hover:bg-slate-100'
                                } disabled:opacity-50`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                                    deleteConfirmStep === 1
                                        ? (isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white')
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                } disabled:opacity-50`}
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : deleteConfirmStep === 1 ? (
                                    'Yes, Delete'
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete Permanently
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
