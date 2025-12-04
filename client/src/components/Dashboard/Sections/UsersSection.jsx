'use client';

import {
    Search,
    UserX,
    UserCheck,
    ChevronRight,
    FileText,
    X,
    Users,
    Building2,
    Mail,
    Briefcase
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import apiClient from "../../../utils/api";

export default function UsersSection({ theme, onNavigateToProposals }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredUser, setHoveredUser] = useState(null);
    const [userProposals, setUserProposals] = useState({});
    const [loadingProposals, setLoadingProposals] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const hoverTimeoutRef = useRef(null);
    const router = useRouter();

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    useEffect(() => {
        fetchUsers();
    }, [pagination.page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/users', {
                params: {
                    role: 'USER',
                    page: pagination.page,
                    limit: 10,
                    search: searchTerm || undefined
                }
            });
            const data = response.data?.data || response.data;
            setUsers(data.users || []);
            setPagination(prev => ({
                ...prev,
                totalPages: data.pagination?.totalPages || 1,
                total: data.pagination?.total || 0
            }));
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Search effect with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page === 1) {
                fetchUsers();
            } else {
                setPagination(prev => ({ ...prev, page: 1 }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchUserProposals = async (userId) => {
        if (userProposals[userId] || loadingProposals[userId]) return;
        
        setLoadingProposals(prev => ({ ...prev, [userId]: true }));
        try {
            const response = await apiClient.get(`/api/proposals`, {
                params: { createdBy: userId, limit: 5 }
            });
            const proposals = response.data?.data?.proposals || response.data?.proposals || [];
            setUserProposals(prev => ({ ...prev, [userId]: proposals }));
        } catch (error) {
            console.error("Error fetching user proposals:", error);
            setUserProposals(prev => ({ ...prev, [userId]: [] }));
        } finally {
            setLoadingProposals(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleMouseEnter = (user) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredUser(user);
            fetchUserProposals(user._id);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredUser(null);
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        setActionLoading(userId);
        try {
            await apiClient.put(`/api/users/${userId}`, {
                isActive: !currentStatus
            });
            setUsers(prev => prev.map(u => 
                u._id === userId ? { ...u, isActive: !currentStatus } : u
            ));
        } catch (error) {
            console.error("Error updating user status:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUserClick = (user) => {
        // Navigate to proposals tab with the first proposal code in search if available
        const proposals = userProposals[user._id];
        if (proposals && proposals.length > 0 && onNavigateToProposals) {
            onNavigateToProposals(proposals[0].proposalCode || '');
        } else if (onNavigateToProposals) {
            onNavigateToProposals(user.fullName || user.email);
        }
    };

    const getStatusBadge = (status) => {
        if (['SUBMITTED', 'AI_EVALUATION'].includes(status)) return { label: 'AI', color: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600' };
        if (['CMPDI_REVIEW', 'EXPERT_REVIEW'].includes(status)) return { label: 'CMPDI', color: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600' };
        if (['CMPDI_ACCEPTED', 'TSSRC_REVIEW'].includes(status)) return { label: 'TSSRC', color: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600' };
        if (['TSSRC_ACCEPTED', 'SSRC_REVIEW'].includes(status)) return { label: 'SSRC', color: isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600' };
        if (status === 'SSRC_ACCEPTED') return { label: 'Funded', color: isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600' };
        if (['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(status)) return { label: 'Rejected', color: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600' };
        if (status === 'DRAFT') return { label: 'Draft', color: isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-black' };
        return { label: status, color: isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-black' };
    };

    const filteredUsers = users;

    if (loading && users.length === 0) {
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
                    <h2 className={`text-2xl font-bold ${textColor}`}>Users</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Manage investigator accounts and view their proposals.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    <Users size={16} />
                    {pagination.total} Total Users
                </div>
            </div>

            {/* Search Bar */}
            <div className={`${cardBg} p-4 rounded-2xl shadow-sm border`}>
                <div className="relative group">
                    <Search
                        size={20}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
                            ${isDark ? 'text-slate-400 group-focus-within:text-slate-200' : 'text-black group-focus-within:text-black'}
                        `}
                    />
                    <input
                        type="text"
                        placeholder="Search by name, email, or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 text-base font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b ${borderColor}`}>
                                <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>User</th>
                                <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Organization</th>
                                <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Designation</th>
                                <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user._id}
                                    className={`group transition-colors cursor-pointer relative ${hoverBg}`}
                                    onMouseEnter={() => handleMouseEnter(user)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleUserClick(user)}
                                >
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-black'}`}>
                                                {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className={`font-bold ${textColor}`}>{user.fullName || 'Unknown User'}</div>
                                                <div className={`text-xs ${subTextColor} flex items-center gap-1`}>
                                                    <Mail size={12} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className={subTextColor} />
                                            <span className={`text-sm font-medium ${textColor}`}>{user.organisationName || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className={subTextColor} />
                                            <span className={`text-sm font-medium ${textColor}`}>{user.designation || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${user.isActive !== false
                                            ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                            : (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            {user.isActive !== false ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggleUserStatus(user._id, user.isActive !== false)}
                                                disabled={actionLoading === user._id}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                                    user.isActive !== false
                                                        ? (isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100')
                                                        : (isDark ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                                                } disabled:opacity-50`}
                                                title={user.isActive !== false ? 'Disable Account' : 'Enable Account'}
                                            >
                                                {actionLoading === user._id ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                ) : user.isActive !== false ? (
                                                    <>
                                                        <UserX size={14} />
                                                        Disable
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={14} />
                                                        Enable
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>

                                    {/* Hover Modal for Proposals */}
                                    {hoveredUser?._id === user._id && (
                                        <td className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50" onClick={(e) => e.stopPropagation()}>
                                            <div className={`${cardBg} rounded-xl shadow-xl border p-4 w-80`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className={`font-bold text-sm ${textColor}`}>Recent Proposals</h4>
                                                    <button 
                                                        onClick={() => setHoveredUser(null)}
                                                        className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                                                    >
                                                        <X size={14} className={subTextColor} />
                                                    </button>
                                                </div>
                                                {loadingProposals[user._id] ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <div className={`w-5 h-5 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
                                                    </div>
                                                ) : userProposals[user._id]?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {userProposals[user._id].map((proposal) => {
                                                            const badge = getStatusBadge(proposal.status);
                                                            return (
                                                                <div
                                                                    key={proposal._id}
                                                                    className={`p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} cursor-pointer hover:opacity-80`}
                                                                    onClick={() => {
                                                                        if (onNavigateToProposals) {
                                                                            onNavigateToProposals(proposal.proposalCode || '');
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-xs font-bold ${textColor} truncate`}>{proposal.title}</p>
                                                                            <p className={`text-[10px] ${subTextColor}`}>{proposal.proposalCode || 'No ID'}</p>
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                                                                            {badge.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <button
                                                            onClick={() => handleUserClick(user)}
                                                            className={`w-full flex items-center justify-center gap-1 py-2 text-xs font-bold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                                        >
                                                            View All Proposals
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={`text-center py-4 ${subTextColor}`}>
                                                        <FileText size={24} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs">No proposals found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className={`p-5 border-t flex items-center justify-between ${borderColor}`}>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                            disabled={pagination.page === 1}
                            className={`px-4 py-2 border rounded-xl text-sm font-bold transition-colors disabled:opacity-50
                                ${isDarkest ? 'border-neutral-800 text-slate-400 hover:bg-neutral-800' :
                                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' :
                                        'border-slate-200 text-black hover:bg-slate-50'}`}
                        >
                            Previous
                        </button>
                        <div className={`text-sm font-medium ${subTextColor}`}>
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                            disabled={pagination.page === pagination.totalPages}
                            className={`px-4 py-2 border rounded-xl text-sm font-bold transition-colors disabled:opacity-50
                                ${isDarkest ? 'border-neutral-800 text-slate-400 hover:bg-neutral-800' :
                                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' :
                                        'border-slate-200 text-black hover:bg-slate-50'}`}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {filteredUsers.length === 0 && !loading && (
                    <div className={`p-8 text-center`}>
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black'}`}>
                            <Users size={32} />
                        </div>
                        <h3 className={`text-base font-bold mb-2 ${textColor}`}>No Users Found</h3>
                        <p className={`text-sm ${subTextColor}`}>
                            {searchTerm ? "Try adjusting your search." : "No users registered yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
