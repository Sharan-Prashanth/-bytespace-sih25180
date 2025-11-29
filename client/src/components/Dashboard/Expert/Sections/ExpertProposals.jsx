'use client';

import {
    Edit,
    Eye,
    FileText,
    Filter,
    Search,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatDate } from '../../../../utils/statusConfig';

export default function ExpertProposals({ proposals, user, theme }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
    const [dueDateFilter, setDueDateFilter] = useState('all');

    const isDark = theme === 'dark' || theme === 'darkest';

    // Theme classes
    const cardBgClass = isDark ? 'bg-slate-900/50 border-slate-800 backdrop-blur-sm' : 'bg-white border-slate-200 shadow-sm';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
    const inputBgClass = isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';

    const reviewStatusLabels = {
        'PENDING': "Pending",
        'IN_PROGRESS': "In Progress",
        'COMPLETED': "Submitted"
    };

    const getReviewStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS':
                return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
            default:
                return isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-800';
        }
    };

    const getDaysRemaining = (dueDate) => {
        const due = new Date(dueDate);
        const today = new Date();
        const daysDiff = Math.floor((due - today) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return `${Math.abs(daysDiff)} days overdue`;
        if (daysDiff === 0) return 'Due today';
        if (daysDiff === 1) return '1 day remaining';
        return `${daysDiff} days remaining`;
    };

    // Apply filters
    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = proposal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            proposal.proposalCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            proposal.createdBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

        // Get reviewer assignment for current user
        const assignment = proposal.assignedReviewers?.find(ar => ar.reviewer === user?._id);
        const reviewStatus = assignment?.status || 'PENDING';
        const matchesStatus = reviewStatusFilter === 'all' || reviewStatus === reviewStatusFilter;

        let matchesDueDate = true;
        if (dueDateFilter !== 'all' && assignment?.dueDate) {
            const dueDate = new Date(assignment.dueDate);
            const today = new Date();
            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

            if (dueDateFilter === '7days') matchesDueDate = daysDiff <= 7 && daysDiff >= 0;
            if (dueDateFilter === '14days') matchesDueDate = daysDiff <= 14 && daysDiff >= 0;
            if (dueDateFilter === 'overdue') matchesDueDate = daysDiff < 0;
        }

        return matchesSearch && matchesStatus && matchesDueDate;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className={`${cardBgClass} rounded-xl shadow-lg p-6 mb-6 border ${borderClass}`}>
                <h2 className={`text-xl font-bold ${textClass} mb-4 flex items-center`}>
                    <Filter className={`w-5 h-5 mr-2 ${isDark ? 'text-orange-400' : 'text-slate-600'}`} />
                    Filter Proposals
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search proposals..."
                            className={`w-full pl-10 pr-4 py-2 ${inputBgClass} border ${borderClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${textClass} placeholder-gray-400`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            className={`pl-10 pr-4 py-2 ${inputBgClass} border ${borderClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${textClass} appearance-none cursor-pointer w-full`}
                            value={reviewStatusFilter}
                            onChange={(e) => setReviewStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending Review</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${isDark ? 'text-orange-400' : 'text-slate-600'}`} />
                    </div>
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            className={`pl-10 pr-4 py-2 ${inputBgClass} border ${borderClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${textClass} appearance-none cursor-pointer w-full`}
                            value={dueDateFilter}
                            onChange={(e) => setDueDateFilter(e.target.value)}
                        >
                            <option value="all">All Due Dates</option>
                            <option value="7days">Due in 7 days</option>
                            <option value="14days">Due in 14 days</option>
                            <option value="overdue">Overdue</option>
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${isDark ? 'text-orange-400' : 'text-slate-600'}`} />
                    </div>
                </div>
            </div>

            {/* Proposals List */}
            <div className={`${cardBgClass} rounded-xl shadow-lg border ${borderClass} overflow-hidden`}>
                <div className={`${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-white'} p-6 border-b ${borderClass}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className={`text-xl font-bold ${textClass} mb-1`}>Proposals for Review</h2>
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
                                    <tr className={`border-b ${borderClass}`}>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Proposal ID</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Title</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>PI / Org</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Assigned Date</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Due Date</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Review Status</th>
                                        <th className={`text-left py-4 px-4 text-sm font-bold ${textClass}`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProposals.map((proposal, index) => (
                                        <tr
                                            key={proposal._id}
                                            className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-100'} ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors duration-200`}
                                        >
                                            <td className="py-4 px-4">
                                                <span className={`text-sm font-semibold ${textClass}`}>{proposal.proposalCode || proposal._id}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${textClass}`}>{proposal.title}</span>
                                                    <span className="text-xs text-gray-500">{proposal.domain}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm ${textClass}`}>{proposal.principalInvestigator}</span>
                                                    <span className="text-xs text-gray-500">{proposal.organization}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-sm ${textClass}`}>{formatDate(proposal.assignedDate)}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm ${textClass}`}>{formatDate(proposal.dueDate)}</span>
                                                    <span className={`text-xs ${proposal.reviewStatus === 'overdue' ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                                        {getDaysRemaining(proposal.dueDate)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getReviewStatusColor(proposal.reviewStatus)}`}>
                                                    {reviewStatusLabels[proposal.reviewStatus]}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex gap-2">
                                                    <Link href={`/proposal/view/${proposal._id}`}>
                                                        <button className={`p-2 ${isDark ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'} rounded-lg transition-colors`} title="View Proposal">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    <Link href={`/proposal/collaborate/${proposal._id}?mode=suggestion`}>
                                                        <button className={`p-2 ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} rounded-lg transition-colors`} title="Suggestion Mode">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                    <Link href={`/proposal/review/${proposal._id}`}>
                                                        <button className={`p-2 ${isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded-lg transition-colors`} title="Submit Review">
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={`text-center py-12 ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border`}>
                            <div className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'} rounded-full flex items-center justify-center border`}>
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className={`text-xl font-bold ${textClass} mb-3`}>No Proposals Found</h3>
                            <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto leading-relaxed">
                                No proposals match your search criteria. Try adjusting your filters.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
