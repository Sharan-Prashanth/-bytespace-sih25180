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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperts.map((expert) => (
                    <div
                        key={expert._id}
                        className={`${cardBg} p-6 rounded-xl shadow-sm border-2 flex flex-col transition-all duration-300 hover:shadow-xl hover:border-orange-300 relative ${hoverBg} group overflow-visible`}
                        onMouseEnter={() => handleMouseEnter(expert)}
                        onMouseLeave={handleMouseLeave}
                        style={{ zIndex: hoveredExpert?._id === expert._id ? 50 : 1 }}
                    >
                        <div className="flex items-start gap-4 mb-5">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 shadow-md ${isDark ? 'bg-gradient-to-br from-orange-900/40 to-orange-800/30 text-orange-400 border-2 border-orange-700/30' : 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 border-2 border-orange-200'}`}>
                                {expert.fullName?.charAt(0) || 'E'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-lg ${textColor} truncate mb-1`}>{expert.fullName || 'Unknown Expert'}</h3>
                                <p className={`text-xs ${subTextColor} flex items-center gap-1.5 truncate`}>
                                    <Mail size={13} />
                                    {expert.email}
                                </p>
                            </div>
                        </div>

                        {/* Organization & Designation */}
                        {(expert.organisationName || expert.designation) && (
                            <div className={`mb-4 space-y-2 p-3 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-orange-50/50'}`}>
                                {expert.organisationName && (
                                    <div className="flex items-center gap-2">
                                        <Building2 size={15} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                                        <span className={`text-sm font-medium ${textColor}`}>{expert.organisationName}</span>
                                    </div>
                                )}
                                {expert.designation && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={15} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                                        <span className={`text-sm font-medium ${textColor}`}>{expert.designation}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Domain Expertise */}
                        <div className="mb-4">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Domain Expertise</p>
                            <div className="flex flex-wrap gap-2">
                                {expert.expertiseDomains && expert.expertiseDomains.length > 0 ? (
                                    expert.expertiseDomains.map((domain, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${isDark ? 'bg-slate-700/50 text-slate-300 border-slate-600' : 'bg-white text-slate-700 border-orange-200'}`}
                                        >
                                            {domain}
                                        </span>
                                    ))
                                ) : (
                                    <span className={`text-xs ${subTextColor} italic`}>No domains specified</span>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`mt-auto pt-4 border-t-2 ${isDark ? 'border-slate-700' : 'border-orange-100'}`}>
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${expert.isActive !== false
                                ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50' : 'bg-emerald-50 text-emerald-600 border-emerald-300')
                                : (isDark ? 'bg-red-900/30 text-red-400 border-red-700/50' : 'bg-red-50 text-red-600 border-red-300')
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${expert.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                {expert.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Hover Modal for Stats - Positioned to RIGHT */}
                        {hoveredExpert?._id === expert._id && (
                            <div 
                                className="absolute left-full top-0 ml-4 z-[100] pointer-events-none"
                                style={{ width: '320px' }}
                            >
                                <div 
                                    className={`rounded-xl shadow-2xl border-2 p-5 pointer-events-auto animate-in fade-in slide-in-from-left-3 duration-300 ${
                                        isDark ? 'bg-slate-800 border-orange-700/50' : 'bg-white border-orange-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className={`font-bold text-base flex items-center gap-2 ${textColor}`}>
                                            <Award className={isDark ? 'text-orange-400' : 'text-orange-600'} size={18} />
                                            Review Statistics
                                        </h4>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setHoveredExpert(null);
                                            }}
                                            className={`p-1.5 rounded-lg transition-all hover:scale-110 ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-orange-100 text-slate-500 hover:text-orange-600'}`}
                                        >
                                            <X size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    {loadingStats[expert._id] ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className={`w-8 h-8 border-4 ${isDark ? 'border-orange-900/30 border-t-orange-400' : 'border-orange-200 border-t-orange-600'} rounded-full animate-spin`}></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Reviewed */}
                                            <div className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                                                isDark ? 'bg-blue-900/20 border-blue-700/40 hover:border-blue-600/60' : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-800/40' : 'bg-blue-100'}`}>
                                                            <FileText size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} strokeWidth={2.5} />
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Reviewed</span>
                                                    </div>
                                                    <span className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        {expertStats[expert._id]?.reviewed || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Accepted */}
                                            <div className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                                                isDark ? 'bg-emerald-900/20 border-emerald-700/40 hover:border-emerald-600/60' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-800/40' : 'bg-emerald-100'}`}>
                                                            <CheckCircle size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} strokeWidth={2.5} />
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Accepted</span>
                                                    </div>
                                                    <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                        {expertStats[expert._id]?.accepted || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Rejected */}
                                            <div className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                                                isDark ? 'bg-red-900/20 border-red-700/40 hover:border-red-600/60' : 'bg-red-50 border-red-200 hover:border-red-400'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-red-800/40' : 'bg-red-100'}`}>
                                                            <XCircle size={18} className={isDark ? 'text-red-400' : 'text-red-600'} strokeWidth={2.5} />
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>Rejected</span>
                                                    </div>
                                                    <span className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                        {expertStats[expert._id]?.rejected || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pending */}
                                            <div className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                                                isDark ? 'bg-amber-900/20 border-amber-700/40 hover:border-amber-600/60' : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-800/40' : 'bg-amber-100'}`}>
                                                            <Clock size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} strokeWidth={2.5} />
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Pending</span>
                                                    </div>
                                                    <span className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                        {expertStats[expert._id]?.pending || 0}
                                                    </span>
                                                </div>
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
