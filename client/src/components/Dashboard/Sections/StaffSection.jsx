'use client';

import {
    LayoutGrid,
    List,
    Search,
    UserPlus,
    Shield,
    X,
    Edit2,
    Trash2,
    AlertTriangle,
    Check,
    Eye,
    EyeOff,
    Building2,
    Award,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import apiClient from "../../../utils/api";

const STAFF_ROLES = [
    { value: 'EXPERT_REVIEWER', label: 'Expert Reviewer', color: 'purple' },
    { value: 'CMPDI_MEMBER', label: 'CMPDI Member', color: 'blue' },
    { value: 'TSSRC_MEMBER', label: 'TSSRC Member', color: 'amber' },
    { value: 'SSRC_MEMBER', label: 'SSRC Member', color: 'cyan' }
];

export default function StaffSection({ theme }) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [hoveredStaff, setHoveredStaff] = useState(null);
    const [staffStats, setStaffStats] = useState({});
    const [loadingStats, setLoadingStats] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'EXPERT_REVIEWER',
        organisationName: '',
        designation: '',
        expertiseDomains: []
    });
    const [showPassword, setShowPassword] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const hoverTimeoutRef = useRef(null);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    useEffect(() => {
        fetchStaff();
    }, [pagination.page]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            // Fetch users with staff roles
            const response = await apiClient.get('/api/users', {
                params: {
                    page: pagination.page,
                    limit: 12,
                    search: searchTerm || undefined
                }
            });
            const data = response.data?.data || response.data;
            const allUsers = data.users || [];
            // Filter only staff members (non-USER roles, excluding SUPER_ADMIN)
            const staffMembers = allUsers.filter(u => 
                u.roles?.some(r => ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(r))
            );
            setStaff(staffMembers);
            setPagination(prev => ({
                ...prev,
                totalPages: data.pagination?.totalPages || 1,
                total: staffMembers.length
            }));
        } catch (error) {
            console.error("Error fetching staff:", error);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    // Search effect with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page === 1) {
                fetchStaff();
            } else {
                setPagination(prev => ({ ...prev, page: 1 }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchStaffStats = async (staffId) => {
        if (staffStats[staffId] || loadingStats[staffId]) return;
        
        setLoadingStats(prev => ({ ...prev, [staffId]: true }));
        try {
            // Fetch proposals reviewed by this staff member
            const response = await apiClient.get(`/api/proposals`, {
                params: { limit: 100 }
            });
            const proposals = response.data?.data?.proposals || response.data?.proposals || [];
            
            // Count accepted and rejected based on reviewer activity
            const accepted = proposals.filter(p => 
                ['CMPDI_ACCEPTED', 'TSSRC_ACCEPTED', 'SSRC_ACCEPTED'].includes(p.status)
            ).length;
            const rejected = proposals.filter(p => 
                ['CMPDI_REJECTED', 'TSSRC_REJECTED', 'SSRC_REJECTED'].includes(p.status)
            ).length;
            
            setStaffStats(prev => ({ ...prev, [staffId]: { accepted, rejected, total: accepted + rejected } }));
        } catch (error) {
            console.error("Error fetching staff stats:", error);
            setStaffStats(prev => ({ ...prev, [staffId]: { accepted: 0, rejected: 0, total: 0 } }));
        } finally {
            setLoadingStats(prev => ({ ...prev, [staffId]: false }));
        }
    };

    const handleMouseEnter = (staffMember) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredStaff(staffMember);
            fetchStaffStats(staffMember._id);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredStaff(null);
    };

    const handleCreateStaff = async () => {
        setActionLoading(true);
        try {
            await apiClient.post('/api/users', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                roles: [formData.role],
                organisationName: formData.organisationName,
                designation: formData.designation,
                expertiseDomains: formData.expertiseDomains
            });
            setShowCreateModal(false);
            resetForm();
            fetchStaff();
        } catch (error) {
            console.error("Error creating staff:", error);
            alert(error.response?.data?.message || 'Failed to create staff account');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditPassword = async () => {
        if (!formData.password) {
            alert('Please enter a new password');
            return;
        }
        setActionLoading(true);
        try {
            await apiClient.put(`/api/users/${selectedStaff._id}`, {
                password: formData.password
            });
            setShowEditModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating password:", error);
            alert(error.response?.data?.message || 'Failed to update password');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStaff = async () => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/api/users/${selectedStaff._id}`);
            setShowDeleteModal(false);
            setSelectedStaff(null);
            fetchStaff();
        } catch (error) {
            console.error("Error deleting staff:", error);
            alert(error.response?.data?.message || 'Failed to delete staff account');
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            password: '',
            role: 'EXPERT_REVIEWER',
            organisationName: '',
            designation: '',
            expertiseDomains: []
        });
        setShowPassword(false);
        setSelectedStaff(null);
    };

    const getRoleInfo = (roles) => {
        if (!roles || roles.length === 0) return { label: 'Unknown', color: 'slate' };
        const staffRole = roles.find(r => ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(r));
        const roleConfig = STAFF_ROLES.find(r => r.value === staffRole);
        return roleConfig || { label: staffRole, color: 'slate' };
    };

    const getRoleStyles = (color) => {
        const styles = {
            purple: isDark ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200',
            blue: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200',
            amber: isDark ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200',
            cyan: isDark ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-cyan-200',
            slate: isDark ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-100 text-black border-slate-200'
        };
        return styles[color] || styles.slate;
    };

    const filteredStaff = staff;

    if (loading && staff.length === 0) {
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
                    <h2 className={`text-2xl font-bold ${textColor}`}>Staff Directory</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Manage committee members and expert reviewers.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm"
                >
                    <UserPlus size={18} />
                    <span>Create Staff Account</span>
                </button>
            </div>

            {/* Search and View Toggle */}
            <div className={`${cardBg} p-4 rounded-2xl shadow-sm border`}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 group">
                        <Search
                            size={20}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
                                ${isDark ? 'text-slate-400 group-focus-within:text-slate-200' : 'text-black group-focus-within:text-black'}
                            `}
                        />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 text-base font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                        />
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

            {/* Content Area */}
            {viewMode === 'table' ? (
                <div className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${borderColor}`}>
                                    <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Staff Member</th>
                                    <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Role</th>
                                    <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Organization</th>
                                    <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    <th className={`p-5 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {filteredStaff.map((staffMember) => {
                                    const roleInfo = getRoleInfo(staffMember.roles);
                                    return (
                                        <tr
                                            key={staffMember._id}
                                            className={`group transition-colors relative ${hoverBg}`}
                                            onMouseEnter={() => handleMouseEnter(staffMember)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-black'}`}>
                                                        {staffMember.fullName?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold ${textColor}`}>{staffMember.fullName || 'Unknown'}</div>
                                                        <div className={`text-xs ${subTextColor}`}>{staffMember.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleStyles(roleInfo.color)}`}>
                                                    <Shield size={12} />
                                                    {roleInfo.label}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className={subTextColor} />
                                                    <span className={`text-sm font-medium ${textColor}`}>{staffMember.organisationName || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${staffMember.isActive !== false
                                                    ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                                    : (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${staffMember.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    {staffMember.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedStaff(staffMember);
                                                            setShowEditModal(true);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-900/20' : 'text-black hover:text-blue-600 hover:bg-blue-50'}`}
                                                        title="Edit Password"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedStaff(staffMember);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-black hover:text-red-600 hover:bg-red-50'}`}
                                                        title="Delete Staff"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Hover Modal for Stats */}
                                            {hoveredStaff?._id === staffMember._id && (
                                                <td className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50">
                                                    <div className={`${cardBg} rounded-xl shadow-xl border p-4 w-64`}>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className={`font-bold text-sm ${textColor}`}>Review Stats</h4>
                                                            <button 
                                                                onClick={() => setHoveredStaff(null)}
                                                                className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                                                            >
                                                                <X size={14} className={subTextColor} />
                                                            </button>
                                                        </div>
                                                        {loadingStats[staffMember._id] ? (
                                                            <div className="flex items-center justify-center py-4">
                                                                <div className={`w-5 h-5 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                                                        <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Accepted</span>
                                                                    </div>
                                                                    <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                                        {staffStats[staffMember._id]?.accepted || 0}
                                                                    </span>
                                                                </div>
                                                                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <XCircle size={16} className={isDark ? 'text-red-400' : 'text-red-600'} />
                                                                        <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Rejected</span>
                                                                    </div>
                                                                    <span className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                                        {staffStats[staffMember._id]?.rejected || 0}
                                                                    </span>
                                                                </div>
                                                                <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <Award size={16} className={subTextColor} />
                                                                        <span className={`text-sm font-medium ${subTextColor}`}>Total Reviews</span>
                                                                    </div>
                                                                    <span className={`text-lg font-bold ${textColor}`}>
                                                                        {staffStats[staffMember._id]?.total || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredStaff.length === 0 && !loading && (
                        <div className={`p-8 text-center`}>
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black'}`}>
                                <Shield size={32} />
                            </div>
                            <h3 className={`text-base font-bold mb-2 ${textColor}`}>No Staff Members Found</h3>
                            <p className={`text-sm ${subTextColor}`}>
                                {searchTerm ? "Try adjusting your search." : "Create a staff account to get started."}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((staffMember) => {
                        const roleInfo = getRoleInfo(staffMember.roles);
                        return (
                            <div
                                key={staffMember._id}
                                className={`${cardBg} p-5 rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md ${hoverBg}`}
                                onMouseEnter={() => handleMouseEnter(staffMember)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-black'}`}>
                                        {staffMember.fullName?.charAt(0) || 'S'}
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleStyles(roleInfo.color)}`}>
                                        <Shield size={12} />
                                        {roleInfo.label}
                                    </span>
                                </div>

                                <h3 className={`font-bold text-base ${textColor}`}>{staffMember.fullName || 'Unknown'}</h3>
                                <p className={`text-sm ${subTextColor} mb-1`}>{staffMember.email}</p>
                                <p className={`text-xs ${subTextColor} mb-4`}>{staffMember.organisationName || 'No organization'}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t ${borderColor}">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${staffMember.isActive !== false
                                        ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                        : (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${staffMember.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        {staffMember.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(staffMember);
                                                setShowEditModal(true);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-900/20' : 'text-black hover:text-blue-600 hover:bg-blue-50'}`}
                                            title="Edit Password"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStaff(staffMember);
                                                setShowDeleteModal(true);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-black hover:text-red-600 hover:bg-red-50'}`}
                                            title="Delete Staff"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Staff Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardBg} rounded-2xl shadow-xl border w-full max-w-md`}>
                        <div className={`p-5 border-b ${borderColor} flex items-center justify-between`}>
                            <h3 className={`text-lg font-bold ${textColor}`}>Create Staff Account</h3>
                            <button onClick={() => { setShowCreateModal(false); resetForm(); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                                <X size={18} className={subTextColor} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className={`w-full px-4 py-3 pr-12 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${subTextColor}`}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                >
                                    {STAFF_ROLES.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Organization</label>
                                <input
                                    type="text"
                                    value={formData.organisationName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, organisationName: e.target.value }))}
                                    className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                    placeholder="Enter organization name"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>Designation</label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                    className={`w-full px-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                    placeholder="Enter designation"
                                />
                            </div>
                        </div>
                        <div className={`p-5 border-t ${borderColor} flex gap-3`}>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className={`flex-1 px-4 py-3 rounded-xl border font-bold text-sm transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-black hover:bg-slate-50'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateStaff}
                                disabled={actionLoading || !formData.fullName || !formData.email || !formData.password}
                                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Password Modal */}
            {showEditModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardBg} rounded-2xl shadow-xl border w-full max-w-md`}>
                        <div className={`p-5 border-b ${borderColor} flex items-center justify-between`}>
                            <h3 className={`text-lg font-bold ${textColor}`}>Edit Password</h3>
                            <button onClick={() => { setShowEditModal(false); resetForm(); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                                <X size={18} className={subTextColor} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <p className={`text-sm font-bold ${textColor}`}>{selectedStaff.fullName}</p>
                                <p className={`text-xs ${subTextColor}`}>{selectedStaff.email}</p>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${textColor}`}>New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className={`w-full px-4 py-3 pr-12 rounded-xl border ${inputBg} ${isDark ? 'text-white' : 'text-black'} outline-none focus:border-blue-500`}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${subTextColor}`}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className={`p-5 border-t ${borderColor} flex gap-3`}>
                            <button
                                onClick={() => { setShowEditModal(false); resetForm(); }}
                                className={`flex-1 px-4 py-3 rounded-xl border font-bold text-sm transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-black hover:bg-slate-50'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditPassword}
                                disabled={actionLoading || !formData.password}
                                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Update Password
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardBg} rounded-2xl shadow-xl border w-full max-w-md`}>
                        <div className={`p-5 border-b ${borderColor}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${textColor}`}>Delete Staff Account</h3>
                                    <p className={`text-sm ${subTextColor}`}>This action cannot be undone</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-900/30' : 'bg-red-50 border border-red-100'}`}>
                                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    Are you sure you want to delete the account for <strong>{selectedStaff.fullName}</strong>? 
                                    All data associated with this staff member will be permanently removed.
                                </p>
                            </div>
                        </div>
                        <div className={`p-5 border-t ${borderColor} flex gap-3`}>
                            <button
                                onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }}
                                className={`flex-1 px-4 py-3 rounded-xl border font-bold text-sm transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-black hover:bg-slate-50'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteStaff}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete Account
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
