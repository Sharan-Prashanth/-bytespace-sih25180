'use client';

import {
    Search,
    Eye,
    FileText,
    Star,
    Clock,
    CheckCircle,
    Calendar,
    Building2,
    MessageSquare,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import apiClient from "../../../../utils/api";
import { formatDate } from "../../../../utils/statusConfig";

export default function MyReviewsSection({ user, theme }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    useEffect(() => {
        fetchMyReviews();
    }, []);

    const fetchMyReviews = async () => {
        try {
            setLoading(true);
            // Fetch all proposals assigned to the expert (including completed ones at any status)
            const [proposalsRes] = await Promise.all([
                apiClient.get('/api/proposals/my-review-history')
            ]);

            const proposals = proposalsRes.data?.data?.proposals || proposalsRes.data?.proposals || [];
            
            // For each proposal, try to fetch the user's opinion and expert report
            const reviewsWithOpinions = await Promise.all(
                proposals.map(async (proposal) => {
                    try {
                        const [opinionRes, reportsRes] = await Promise.all([
                            apiClient.get(`/api/proposals/${proposal._id}/opinions/check`),
                            apiClient.get(`/api/proposals/${proposal._id}/reports`)
                        ]);
                        
                        const hasOpinion = opinionRes.data?.data?.hasOpinion;
                        const opinion = opinionRes.data?.data?.opinion;
                        
                        // Find expert's submitted report
                        const allReports = reportsRes.data?.data || [];
                        const expertReport = allReports.find(r => 
                            r.reportType === 'EXPERT_REVIEW' && 
                            r.createdBy?._id === user?._id &&
                            r.status === 'SUBMITTED'
                        );
                        
                        return {
                            ...proposal,
                            hasSubmittedOpinion: hasOpinion,
                            myOpinion: opinion,
                            myReport: expertReport
                        };
                    } catch {
                        return {
                            ...proposal,
                            hasSubmittedOpinion: false,
                            myOpinion: null,
                            myReport: null
                        };
                    }
                })
            );

            setReviews(reviewsWithOpinions);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter reviews that have been submitted
    const submittedReviews = reviews.filter(r => r.hasSubmittedOpinion);
    const pendingReviews = reviews.filter(r => !r.hasSubmittedOpinion);

    const filteredReviews = submittedReviews.filter(review => {
        const matchesSearch = review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.proposalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.projectLeader?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : (isDark ? 'text-slate-600' : 'text-slate-300')
                        }
                    />
                ))}
            </div>
        );
    };

    const renderReviewCard = (review) => {
        const assignment = review.assignedReviewers?.find(ar => 
            ar.reviewer === user?._id || ar.reviewer?._id === user?._id
        );

        return (
            <div key={review._id} className={`${cardBg} p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${hoverBg}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
                        <CheckCircle size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isDark ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        Review Submitted
                    </span>
                </div>

                {/* Proposal Info */}
                <h3 className={`font-bold text-sm mb-1 ${textColor} line-clamp-2`}>{review.title}</h3>
                <p className={`text-xs mb-1 ${subTextColor}`}>{review.principalAgency}</p>
                <p className={`text-xs mb-3 ${subTextColor}`}>PI: {review.projectLeader || '-'}</p>

                {/* Rating */}
                {review.myOpinion && (
                    <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold ${textColor}`}>Your Rating</span>
                            {renderStars(review.myOpinion.rating)}
                        </div>
                        <p className={`text-xs ${subTextColor} line-clamp-3`}>
                            {review.myOpinion.opinion}
                        </p>
                        <p className={`text-[10px] mt-2 ${subTextColor}`}>
                            Submitted: {formatDate(review.myOpinion.createdAt)}
                        </p>
                    </div>
                )}

                {/* Assignment Info */}
                <div className={`text-[10px] space-y-1 ${subTextColor}`}>
                    <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>Assigned: {formatDate(assignment?.assignedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Building2 size={10} />
                        <span>By: {assignment?.assignedBy?.fullName || 'CMPDI'}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 mt-3 border-t ${borderColor}`}>
                    <span className={`text-[10px] font-bold ${textColor}`}>{review.proposalCode || 'No ID'}</span>
                    <div className="flex gap-1">
                        <Link href={`/proposal/view/${review._id}`}>
                            <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-slate-100 text-emerald-500'}`} title="View Proposal">
                                <Eye size={14} />
                            </button>
                        </Link>
                        {review.myReport?.fileUrl && (
                            <a href={review.myReport.fileUrl} target="_blank" rel="noopener noreferrer">
                                <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`} title="View My Report">
                                    <FileText size={14} />
                                </button>
                            </a>
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
                    <h2 className={`text-xl font-bold ${textColor}`}>My Reviews</h2>
                    <p className={`${subTextColor} text-sm`}>View your submitted expert opinions and ratings.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`${cardBg} p-4 rounded-xl border`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${textColor}`}>{reviews.length}</p>
                            <p className={`text-xs ${subTextColor}`}>Total Assigned</p>
                        </div>
                    </div>
                </div>
                <div className={`${cardBg} p-4 rounded-xl border`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${textColor}`}>{submittedReviews.length}</p>
                            <p className={`text-xs ${subTextColor}`}>Reviews Submitted</p>
                        </div>
                    </div>
                </div>
                <div className={`${cardBg} p-4 rounded-xl border`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${textColor}`}>{pendingReviews.length}</p>
                            <p className={`text-xs ${subTextColor}`}>Pending Reviews</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className={`${cardBg} p-3 rounded-xl shadow-sm border`}>
                <div className="relative group w-full">
                    <Search
                        size={16}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300
                            ${isDark ? 'text-slate-400 group-focus-within:text-slate-300' : 'text-black group-focus-within:text-black'}
                        `}
                    />
                    <input
                        type="text"
                        placeholder="Search your reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border outline-none shadow-sm hover:shadow-md ${inputBg} ${isDark ? 'text-white placeholder-slate-500' : 'text-black placeholder-slate-400'} focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>
            </div>

            {/* Reviews Grid */}
            {filteredReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredReviews.map((review) => renderReviewCard(review))}
                </div>
            ) : (
                <div className={`${cardBg} rounded-xl p-8 text-center border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-black'}`}>
                        <MessageSquare size={32} />
                    </div>
                    <h3 className={`text-base font-bold mb-2 ${textColor}`}>No Reviews Found</h3>
                    <p className={`text-sm mb-4 ${subTextColor}`}>
                        {searchTerm
                            ? "No reviews match your search."
                            : "You haven't submitted any reviews yet. Go to Assigned Proposals to review."}
                    </p>
                    {!searchTerm && (
                        <Link href="#" onClick={(e) => { e.preventDefault(); }} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            <FileText size={16} />
                            View Assigned Proposals
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
