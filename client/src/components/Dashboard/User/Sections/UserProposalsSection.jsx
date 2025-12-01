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
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate, isRejected, canModifyProposal } from "../../../../utils/statusConfig";

export default function UserProposalsSection({ proposals, theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [filterStatus, setFilterStatus] = useState('all');
    const [showRejected, setShowRejected] = useState(false);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    // Separate rejected and active proposals
    const rejectedProposals = proposals.filter(p => isRejected(p.status));
    const activeProposals = proposals.filter(p => !isRejected(p.status));

    // Filter Logic - show either active or rejected based on toggle
    const proposalsToFilter = showRejected ? rejectedProposals : activeProposals;
    
    const filteredProposals = proposalsToFilter.filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Find last draft
    const lastDraft = [...proposals]
        .filter(p => p.status === PROPOSAL_STATUS.DRAFT || p.status === PROPOSAL_STATUS.AI_REJECTED)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    // Render proposal row for table view
    const renderProposalRow = (proposal, isRejectedSection = false) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const canEdit = canModifyProposal(proposal.status);
        
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
                        {/* For rejected proposals: only View and Track */}
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
                        ) : (
                            <>
                                {/* Active proposals: Edit/Collaborate, View, Track */}
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
                                <Link href={`/proposal/track/${proposal._id}`}>
                                    <button className={`p-1.5 rounded-lg ${isDark ? 'text-purple-400 hover:bg-purple-900/20' : 'text-purple-600 hover:bg-purple-50'}`} title="Track Progress">
                                        <BarChart3 size={16} />
                                    </button>
                                </Link>
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
        const isAIRejected = proposal.status === PROPOSAL_STATUS.AI_REJECTED;
        
        return (
            <div key={proposal._id} className={`${cardBg} p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRejectedProposal ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600') : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                        {isRejectedProposal ? <XCircle size={20} /> : <FileText size={20} />}
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
                                <Link href={`/proposal/track/${proposal._id}`}>
                                    <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-purple-400' : 'hover:bg-slate-100 text-purple-500'}`} title="Track">
                                        <BarChart3 size={14} />
                                    </button>
                                </Link>
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
                {/* Active/Rejected Toggle */}
                {rejectedProposals.length > 0 && (
                    <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setShowRejected(false)}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${!showRejected
                                ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        >
                            Active ({activeProposals.length})
                        </button>
                        <button
                            onClick={() => setShowRejected(true)}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${showRejected
                                ? (isDark ? 'bg-red-900/50 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        >
                            <XCircle size={14} />
                            Rejected ({rejectedProposals.length})
                        </button>
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
                {!showRejected && (
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
                        <option value={PROPOSAL_STATUS.SSRC_ACCEPTED}>SSRC Accepted</option>
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
                                    {filteredProposals.map((proposal) => renderProposalRow(proposal, showRejected))}
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
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${showRejected ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-400') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black')}`}>
                        {showRejected ? <XCircle size={32} /> : <FileText size={32} />}
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${textColor}`}>
                        {showRejected ? 'No Rejected Proposals' : 'No Proposals Found'}
                    </h3>
                    <p className={`text-sm mb-4 ${subTextColor}`}>
                        {searchTerm || filterStatus !== 'all' 
                            ? "Try adjusting your filters." 
                            : showRejected 
                                ? "You don't have any rejected proposals."
                                : "Start by creating your first research proposal."}
                    </p>
                    {!showRejected && (
                        <Link href="/proposal/create">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                                Create Proposal
                            </button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
