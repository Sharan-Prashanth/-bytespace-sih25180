'use client';

import {
    BarChart3,
    Clock,
    ClipboardCheck,
    Eye,
    FileText,
    LayoutGrid,
    List,
    Search,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Hourglass
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import apiClient from "../../../../utils/api";
import { STATUS_CONFIG, formatDate } from "../../../../utils/statusConfig";

export default function ExpertProposalsSection({ user, theme }) {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewSection, setViewSection] = useState('pending');

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    useEffect(() => {
        fetchAssignedProposals();
    }, []);

    const fetchAssignedProposals = async () => {
        try {
            setLoading(true);
            // Fetch proposals assigned to this expert
            const response = await apiClient.get('/api/proposals/assigned-to-me');
            const proposalData = response.data?.data?.proposals || response.data?.proposals || [];
            setProposals(Array.isArray(proposalData) ? proposalData : []);
        } catch (error) {
            console.error("Error fetching assigned proposals:", error);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    // Get the assignment info for current user
    const getAssignment = (proposal) => {
        return proposal.assignedReviewers?.find(ar => 
            ar.reviewer === user?._id || ar.reviewer?._id === user?._id
        );
    };

    // Categorize by review status
    const pendingReviews = proposals.filter(p => {
        const assignment = getAssignment(p);
        return !assignment?.status || assignment?.status === 'PENDING';
    });

    const inProgressReviews = proposals.filter(p => {
        const assignment = getAssignment(p);
        return assignment?.status === 'IN_PROGRESS';
    });

    const completedReviews = proposals.filter(p => {
        const assignment = getAssignment(p);
        return assignment?.status === 'COMPLETED';
    });

    const getProposalsToFilter = () => {
        switch (viewSection) {
            case 'in_progress':
                return inProgressReviews;
            case 'completed':
                return completedReviews;
            default:
                return pendingReviews;
        }
    };

    const filteredProposals = getProposalsToFilter().filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.projectLeader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proposal.principalAgency?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getDaysRemaining = (dueDate) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        const daysDiff = Math.floor((due - today) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return { text: `${Math.abs(daysDiff)} days overdue`, isOverdue: true };
        if (daysDiff === 0) return { text: 'Due today', isUrgent: true };
        if (daysDiff === 1) return { text: '1 day remaining', isUrgent: true };
        if (daysDiff <= 3) return { text: `${daysDiff} days remaining`, isUrgent: true };
        return { text: `${daysDiff} days remaining`, isOverdue: false };
    };

    const renderProposalRow = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const assignment = getAssignment(proposal);
        const daysInfo = getDaysRemaining(assignment?.dueDate);
        const isCompleted = viewSection === 'completed';

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
                    <span className={`text-sm ${subTextColor}`}>{formatDate(assignment?.assignedAt)}</span>
                    <div className={`text-xs ${subTextColor}`}>
                        by {assignment?.assignedBy?.fullName || 'CMPDI'}
                    </div>
                </td>
                <td className="p-3 px-4">
                    {assignment?.dueDate && (
                        <div>
                            <span className={`text-sm ${textColor}`}>{formatDate(assignment.dueDate)}</span>
                            {daysInfo && (
                                <div className={`text-xs font-bold ${
                                    daysInfo.isOverdue 
                                        ? 'text-red-500' 
                                        : daysInfo.isUrgent 
                                            ? 'text-orange-500' 
                                            : 'text-green-500'
                                }`}>
                                    {daysInfo.text}
                                </div>
                            )}
                        </div>
                    )}
                </td>
                <td className="p-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </td>
                <td className="p-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                        <Link href={`/proposal/collaborate/${proposal._id}?mode=suggestion`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`} title="Suggest Changes">
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
                        {!isCompleted && (
                            <Link href={`/proposal/review/${proposal._id}`}>
                                <button className={`p-1.5 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-900/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Submit Review">
                                    <ClipboardCheck size={16} />
                                </button>
                            </Link>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const renderProposalCard = (proposal) => {
        const statusConfig = STATUS_CONFIG[proposal.status];
        const assignment = getAssignment(proposal);
        const daysInfo = getDaysRemaining(assignment?.dueDate);
        const isCompleted = viewSection === 'completed';
        const isPending = viewSection === 'pending';

        return (
            <div key={proposal._id} className={`${cardBg} p-4 rounded-xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCompleted 
                            ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600')
                            : isPending
                                ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-600')
                                : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                    }`}>
                        {isCompleted ? <CheckCircle size={20} /> : isPending ? <Hourglass size={20} /> : <Clock size={20} />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                        {statusConfig?.label || proposal.status}
                    </span>
                </div>

                <h3 className={`font-bold text-sm mb-1 ${textColor} line-clamp-2`}>{proposal.title}</h3>
                <p className={`text-xs mb-1 ${subTextColor}`}>{proposal.principalAgency}</p>
                <p className={`text-xs mb-2 ${subTextColor}`}>PI: {proposal.projectLeader || '-'}</p>

                {/* Assignment Info */}
                <div className={`text-[10px] mb-2 p-2 rounded-lg ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={subTextColor}>
                        <span className="font-bold">Assigned:</span> {formatDate(assignment?.assignedAt)}
                    </p>
                    <p className={subTextColor}>
                        <span className="font-bold">By:</span> {assignment?.assignedBy?.fullName || 'CMPDI Member'}
                    </p>
                    {assignment?.dueDate && (
                        <p className={subTextColor}>
                            <span className="font-bold">Due:</span> {formatDate(assignment.dueDate)}
                        </p>
                    )}
                </div>

                {/* Due Date Warning */}
                {daysInfo && !isCompleted && (
                    <div className={`text-[10px] mb-2 p-2 rounded-lg flex items-center gap-1 ${
                        daysInfo.isOverdue 
                            ? (isDark ? 'bg-red-900/30 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-200 text-red-700')
                            : daysInfo.isUrgent
                                ? (isDark ? 'bg-orange-900/30 border border-orange-500/30 text-orange-400' : 'bg-orange-50 border border-orange-200 text-orange-700')
                                : (isDark ? 'bg-green-900/30 border border-green-500/30 text-green-400' : 'bg-green-50 border border-green-200 text-green-700')
                    }`}>
                        {daysInfo.isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                        <span className="font-bold">{daysInfo.text}</span>
                    </div>
                )}

                <div className={`flex items-center justify-between pt-2 border-t mt-auto ${borderColor}`}>
                    <span className={`text-[10px] font-bold ${textColor}`}>{proposal.proposalCode || 'No ID'}</span>
                    <div className="flex gap-1">
                        <Link href={`/proposal/collaborate/${proposal._id}?mode=suggestion`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`} title="Suggest">
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
                        {!isCompleted && (
                            <Link href={`/proposal/review/${proposal._id}`}>
                                <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-orange-400' : 'hover:bg-slate-100 text-orange-500'}`} title="Review">
                                    <ClipboardCheck size={14} />
                                </button>
                            </Link>
                        )}
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className={`text-xl font-bold ${textColor}`}>Assigned Proposals</h2>
                    <p className={`${subTextColor} text-sm`}>Review and provide expert feedback on assigned proposals.</p>
                </div>
            </div>

            {/* Filters & View Toggle */}
            <div className={`${cardBg} p-3 rounded-xl shadow-sm border flex flex-col sm:flex-row items-center gap-3`}>
                {/* Section Toggle */}
                <div className={`flex items-center p-1 rounded-xl border flex-wrap ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => setViewSection('pending')}
                        className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'pending'
                            ? (isDark ? 'bg-yellow-900/50 text-yellow-400 shadow-sm' : 'bg-yellow-50 text-yellow-700 shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                    >
                        <Hourglass size={14} />
                        Pending ({pendingReviews.length})
                    </button>
                    {inProgressReviews.length > 0 && (
                        <button
                            onClick={() => setViewSection('in_progress')}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'in_progress'
                                ? (isDark ? 'bg-blue-900/50 text-blue-400 shadow-sm' : 'bg-blue-50 text-blue-600 shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        >
                            <Clock size={14} />
                            In Progress ({inProgressReviews.length})
                        </button>
                    )}
                    {completedReviews.length > 0 && (
                        <button
                            onClick={() => setViewSection('completed')}
                            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1.5 ${viewSection === 'completed'
                                ? (isDark ? 'bg-green-900/50 text-green-400 shadow-sm' : 'bg-green-50 text-green-600 shadow-sm')
                                : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-black hover:text-black')}`}
                        >
                            <CheckCircle size={14} />
                            Completed ({completedReviews.length})
                        </button>
                    )}
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
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Assigned</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Due Date</th>
                                        <th className={`p-3 px-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
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
                        {searchTerm
                            ? "Try adjusting your search."
                            : viewSection === 'pending'
                                ? "No pending reviews assigned to you."
                                : viewSection === 'in_progress'
                                    ? "No reviews in progress."
                                    : "No completed reviews yet."}
                    </p>
                </div>
            )}
        </div>
    );
}
