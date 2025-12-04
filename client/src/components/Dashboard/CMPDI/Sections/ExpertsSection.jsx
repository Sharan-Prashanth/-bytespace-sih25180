'use client';

import {
    Search,
    UserCheck,
    Award,
    X,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    Mail,
    Briefcase
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import apiClient from "../../../../utils/api";

export default function ExpertsSection({ theme }) {
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredExpert, setHoveredExpert] = useState(null);
    const [expertStats, setExpertStats] = useState({});
    const [loadingStats, setLoadingStats] = useState({});
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
        fetchExperts();
    }, []);

    const fetchExperts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/users/experts/list', {
                params: { limit: 50 }
            });
            const data = response.data?.data || response.data || [];
            setExperts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching experts:", error);
            setExperts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpertStats = async (expertId) => {
        if (expertStats[expertId] || loadingStats[expertId]) return;
        
        setLoadingStats(prev => ({ ...prev, [expertId]: true }));
        try {
            // Fetch proposals to calculate expert stats
            const response = await apiClient.get('/api/proposals', {
                params: { limit: 200 }
            });
            const proposals = response.data?.data?.proposals || response.data?.proposals || [];
            
            // Count proposals reviewed by this expert
            let reviewed = 0;
            let accepted = 0;
            let rejected = 0;
            let pending = 0;

            proposals.forEach(proposal => {
                const expertReview = proposal.assignedReviewers?.find(
                    r => r.reviewer?._id === expertId || r.reviewer === expertId
                );
                if (expertReview) {
                    reviewed++;
                    if (expertReview.status === 'COMPLETED' || expertReview.status === 'APPROVED') {
                        accepted++;
                    } else if (expertReview.status === 'REJECTED') {
                        rejected++;
                    } else {
                        pending++;
                    }
                }
            });
            
            setExpertStats(prev => ({ 
                ...prev, 
                [expertId]: { reviewed, accepted, rejected, pending } 
            }));
        } catch (error) {
            console.error("Error fetching expert stats:", error);
            setExpertStats(prev => ({ ...prev, [expertId]: { reviewed: 0, accepted: 0, rejected: 0, pending: 0 } }));
        } finally {
            setLoadingStats(prev => ({ ...prev, [expertId]: false }));
        }
    };

    const handleMouseEnter = (expert) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredExpert(expert);
            fetchExpertStats(expert._id);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredExpert(null);
    };

    const filteredExperts = experts.filter(expert =>
        expert.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.expertiseDomains?.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <h2 className={`text-2xl font-bold ${textColor}`}>Expert Reviewers</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>View expert reviewers and their domain expertise.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${isDark ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                    <UserCheck size={16} />
                    {experts.length} Experts
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
                        placeholder="Search by name, email, or domain expertise..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 text-base font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>
            </div>

            {/* Experts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExperts.map((expert) => (
                    <div
                        key={expert._id}
                        className={`${cardBg} p-5 rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md relative ${hoverBg}`}
                        onMouseEnter={() => handleMouseEnter(expert)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                                {expert.fullName?.charAt(0) || 'E'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-base ${textColor} truncate`}>{expert.fullName || 'Unknown Expert'}</h3>
                                <p className={`text-xs ${subTextColor} flex items-center gap-1 truncate`}>
                                    <Mail size={12} />
                                    {expert.email}
                                </p>
                            </div>
                        </div>

                        {/* Organization & Designation */}
                        {(expert.organisationName || expert.designation) && (
                            <div className={`mb-3 space-y-1`}>
                                {expert.organisationName && (
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className={subTextColor} />
                                        <span className={`text-sm ${textColor}`}>{expert.organisationName}</span>
                                    </div>
                                )}
                                {expert.designation && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={14} className={subTextColor} />
                                        <span className={`text-sm ${textColor}`}>{expert.designation}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Domain Expertise */}
                        <div className="mb-3">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Domain Expertise</p>
                            <div className="flex flex-wrap gap-1.5">
                                {expert.expertiseDomains && expert.expertiseDomains.length > 0 ? (
                                    expert.expertiseDomains.map((domain, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-black'}`}
                                        >
                                            {domain}
                                        </span>
                                    ))
                                ) : (
                                    <span className={`text-xs ${subTextColor}`}>No domains specified</span>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`mt-auto pt-3 border-t ${borderColor}`}>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${expert.isActive !== false
                                ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                : (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${expert.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                {expert.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Hover Modal for Stats */}
                        {hoveredExpert?._id === expert._id && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
                                <div className={`${cardBg} rounded-xl shadow-xl border p-4 w-72`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className={`font-bold text-sm ${textColor}`}>Review Statistics</h4>
                                        <button 
                                            onClick={() => setHoveredExpert(null)}
                                            className={`p-1 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700' : ''}`}
                                        >
                                            <X size={14} className={subTextColor} />
                                        </button>
                                    </div>
                                    {loadingStats[expert._id] ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className={`w-5 h-5 border-2 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                                    <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Reviewed</span>
                                                </div>
                                                <span className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {expertStats[expert._id]?.reviewed || 0}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                                    <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Accepted</span>
                                                </div>
                                                <span className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    {expertStats[expert._id]?.accepted || 0}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <XCircle size={14} className={isDark ? 'text-red-400' : 'text-red-600'} />
                                                    <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Rejected</span>
                                                </div>
                                                <span className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                    {expertStats[expert._id]?.rejected || 0}
                                                </span>
                                            </div>
                                            <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                                                    <span className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Pending</span>
                                                </div>
                                                <span className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    {expertStats[expert._id]?.pending || 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredExperts.length === 0 && !loading && (
                <div className={`${cardBg} rounded-xl p-8 text-center border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black'}`}>
                        <UserCheck size={32} />
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${textColor}`}>No Experts Found</h3>
                    <p className={`text-sm ${subTextColor}`}>
                        {searchTerm ? "Try adjusting your search." : "No expert reviewers registered yet."}
                    </p>
                </div>
            )}
        </div>
    );
}
