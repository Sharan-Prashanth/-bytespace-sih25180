'use client';

import {
    BarChart3,
    Edit,
    Eye,
    FileText,
    LayoutGrid,
    List,
    Plus,
    Search
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate } from "../../../../utils/statusConfig";

export default function UserProposalsSection({ proposals, theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [filterStatus, setFilterStatus] = useState('all');

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    // Filter Logic
    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const lastDraft = proposals.find(p => p.status === PROPOSAL_STATUS.DRAFT);

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>My Proposals</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Manage and track your research submissions.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {lastDraft && (
                        <Link href={`/proposal/create?draft=${lastDraft._id}`}>
                            <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm border ${isDark ? 'bg-blue-900/20 text-blue-400 border-blue-900/50 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
                                <Edit size={18} />
                                <span>Continue Draft</span>
                            </button>
                        </Link>
                    )}
                    <Link href="/proposal/create">
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
                            <Plus size={18} />
                            <span>New Proposal</span>
                        </button>
                    </Link>
                </div>
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
                        className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border outline-none shadow-sm hover:shadow-md cursor-pointer ${inputBg} ${isDark ? 'text-white' : 'text-slate-900'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                >
                    <option value="all">All Status</option>
                    <option value={PROPOSAL_STATUS.DRAFT}>Draft</option>
                    <option value={PROPOSAL_STATUS.CMPDI_REVIEW}>CMPDI Review</option>
                    <option value={PROPOSAL_STATUS.TSSRC_REVIEW}>TSSRC Review</option>
                    <option value={PROPOSAL_STATUS.SSRC_REVIEW}>SSRC Review</option>
                    <option value={PROPOSAL_STATUS.ONGOING}>Ongoing</option>
                </select>

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
            {filteredProposals.length > 0 ? (
                viewMode === 'table' ? (
                    // Table View
                    <div className={`${cardBg} rounded-3xl shadow-sm border overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${borderColor}`}>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal ID</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Title</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Submitted</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Last Updated</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                    {filteredProposals.map((proposal) => {
                                        const statusConfig = STATUS_CONFIG[proposal.status];
                                        return (
                                            <tr key={proposal._id} className={`group transition-colors ${hoverBg}`}>
                                                <td className="p-6">
                                                    <span className={`text-sm font-bold ${textColor}`}>{proposal.proposalCode || '-'}</span>
                                                </td>
                                                <td className="p-6">
                                                    <div className={`font-bold ${textColor} line-clamp-1`}>{proposal.title}</div>
                                                    <div className={`text-xs ${subTextColor}`}>{proposal.principalAgency}</div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                        {statusConfig?.label || proposal.status}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`text-sm font-medium ${subTextColor}`}>
                                                        {proposal.status !== PROPOSAL_STATUS.DRAFT ? formatDate(proposal.createdAt) : '-'}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`text-sm font-medium ${subTextColor}`}>{formatDate(proposal.updatedAt)}</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {proposal.status === PROPOSAL_STATUS.DRAFT ? (
                                                            <Link href={`/proposal/create?draft=${proposal._id}`}>
                                                                <button className={`p-2 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Edit Draft">
                                                                    <Edit size={16} />
                                                                </button>
                                                            </Link>
                                                        ) : (
                                                            <Link href={`/proposal/collaborate/${proposal._id}`}>
                                                                <button className={`p-2 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`} title="Collaborate">
                                                                    <Edit size={16} />
                                                                </button>
                                                            </Link>
                                                        )}
                                                        <Link href={`/proposal/view/${proposal._id}`}>
                                                            <button className={`p-2 rounded-lg ${isDark ? 'text-emerald-400 hover:bg-emerald-900/20' : 'text-emerald-600 hover:bg-emerald-50'}`} title="View">
                                                                <Eye size={16} />
                                                            </button>
                                                        </Link>
                                                        <Link href={`/proposal/track/${proposal._id}`}>
                                                            <button className={`p-2 rounded-lg ${isDark ? 'text-purple-400 hover:bg-purple-900/20' : 'text-purple-600 hover:bg-purple-50'}`} title="Track Progress">
                                                                <BarChart3 size={16} />
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Card View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProposals.map((proposal) => {
                            const statusConfig = STATUS_CONFIG[proposal.status];
                            return (
                                <div key={proposal._id} className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                            <FileText size={24} />
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {statusConfig?.label || proposal.status}
                                        </span>
                                    </div>

                                    <h3 className={`font-bold text-lg mb-2 ${textColor} line-clamp-2`}>{proposal.title}</h3>
                                    <p className={`text-sm mb-6 ${subTextColor}`}>{proposal.principalAgency}</p>

                                    <div className={`flex items-center justify-between pt-4 border-t mt-auto ${borderColor}`}>
                                        <span className={`text-xs font-bold ${textColor}`}>{proposal.proposalCode || 'No ID'}</span>
                                        <div className="flex gap-2">
                                            <Link href={`/proposal/view/${proposal._id}`}>
                                                <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                                    <Eye size={16} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                // Empty State
                <div className={`${cardBg} rounded-3xl p-12 text-center border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                        <FileText size={40} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${textColor}`}>No Proposals Found</h3>
                    <p className={`text-sm mb-6 ${subTextColor}`}>
                        {searchTerm || filterStatus !== 'all' ? "Try adjusting your filters." : "Start by creating your first research proposal."}
                    </p>
                    <Link href="/proposal/create">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                            Create Proposal
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
