'use client';

import {
    Activity,
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '../../../../utils/statusConfig';

// Counter animation component
const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(targetValue * easeOutQuart));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [targetValue, duration]);

    return <span>{count}</span>;
};

export default function ExpertHome({ stats, theme, proposals = [], user, onViewCalendar }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    
    // Theme classes based on the provided image (Dark Navy/Slate theme)
    const cardBaseClass = isDark 
        ? 'bg-[#1e293b] border-slate-700/50 shadow-lg' 
        : 'bg-white border-slate-200 shadow-sm';
        
    const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
    const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderClass = isDark ? 'border-slate-700/50' : 'border-slate-200';

    // Filter upcoming deadlines (due in next 14 days and not completed)
    const upcomingDeadlines = proposals
        .filter(p => {
            const assignment = p.assignedReviewers?.find(ar => ar.reviewer === user?._id);
            if (!assignment || assignment.status === 'COMPLETED' || !assignment.dueDate) return false;
            
            const dueDate = new Date(assignment.dueDate);
            const today = new Date();
            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            
            return daysDiff >= 0 && daysDiff <= 14;
        })
        .sort((a, b) => {
            const dateA = new Date(a.assignedReviewers?.find(ar => ar.reviewer === user?._id)?.dueDate);
            const dateB = new Date(b.assignedReviewers?.find(ar => ar.reviewer === user?._id)?.dueDate);
            return dateA - dateB;
        })
        .slice(0, 3);

    // Mock Recent Activity
    const recentActivity = [
        { id: 1, type: 'review', message: 'Submitted review for "AI in Coal Mining"', time: '2 hours ago', icon: CheckCircle, color: 'text-emerald-500' },
        { id: 2, type: 'assignment', message: 'New proposal assigned: "Sustainable Mining Tech"', time: '1 day ago', icon: FileText, color: 'text-blue-500' },
        { id: 3, type: 'system', message: 'System maintenance scheduled for tonight', time: '2 days ago', icon: AlertTriangle, color: 'text-yellow-500' },
        { id: 4, type: 'deadline', message: 'Deadline approaching for "Green Energy Initiative"', time: '3 days ago', icon: Clock, color: 'text-orange-500' },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col gap-4 overflow-hidden">
            {/* Statistics Dashboard - Compact Row with Neon Accents */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
                {/* Total Assigned Card - Blue Accent */}
                <div className={`group relative overflow-hidden border rounded-xl p-4 transition-all duration-300 flex items-center justify-between
                    ${isDark ? 'bg-[#1e293b] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white border-blue-200 shadow-sm'}
                `}>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Total Assigned</p>
                        <div className={`text-3xl font-black mt-1 ${textClass}`}>
                            <AnimatedCounter targetValue={stats.totalAssigned} duration={2000} />
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                {/* Pending Reviews Card - Purple Accent */}
                <div className={`group relative overflow-hidden border rounded-xl p-4 transition-all duration-300 flex items-center justify-between
                    ${isDark ? 'bg-[#1e293b] border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-white border-purple-200 shadow-sm'}
                `}>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Pending</p>
                        <div className={`text-3xl font-black mt-1 ${textClass}`}>
                            <AnimatedCounter targetValue={stats.pendingReviews} duration={2200} />
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                {/* Reviews Submitted Card - Emerald/Green Accent */}
                <div className={`group relative overflow-hidden border rounded-xl p-4 transition-all duration-300 flex items-center justify-between
                    ${isDark ? 'bg-[#1e293b] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white border-emerald-200 shadow-sm'}
                `}>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Submitted</p>
                        <div className={`text-3xl font-black mt-1 ${textClass}`}>
                            <AnimatedCounter targetValue={stats.reviewsSubmitted} duration={2400} />
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>

                {/* Overdue Card - Red Accent */}
                <div className={`group relative overflow-hidden border rounded-xl p-4 transition-all duration-300 flex items-center justify-between
                    ${isDark ? 'bg-[#1e293b] border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white border-red-200 shadow-sm'}
                `}>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>Overdue</p>
                        <div className={`text-3xl font-black mt-1 ${textClass}`}>
                            <AnimatedCounter targetValue={stats.overdue} duration={2600} />
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Content Grid - Fills remaining height */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
                    {/* Upcoming Deadlines - Takes 60% of left column */}
                    <div className={`${cardBaseClass} rounded-xl p-5 flex flex-col flex-[1.5] min-h-0`}>
                        <div className="flex justify-between items-center mb-3 shrink-0">
                            <h3 className={`text-base font-bold ${textClass} flex items-center`}>
                                <Calendar className={`w-4 h-4 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                Upcoming Deadlines
                            </h3>
                            <button onClick={onViewCalendar} className="text-xs text-blue-500 hover:underline">View Calendar</button>
                        </div>
                        
                        <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                            {upcomingDeadlines.length > 0 ? (
                                upcomingDeadlines.map((proposal) => {
                                    const assignment = proposal.assignedReviewers?.find(ar => ar.reviewer === user?._id);
                                    const dueDate = new Date(assignment.dueDate);
                                    const today = new Date();
                                    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
                                    
                                    return (
                                        <div key={proposal._id} className={`flex items-center justify-between p-3 rounded-lg border ${borderClass} ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                                            <div className="min-w-0">
                                                <h4 className={`font-semibold ${textClass} text-sm truncate`}>{proposal.title}</h4>
                                                <p className={`text-xs ${subTextClass} mt-0.5`}>ID: {proposal.proposalCode || proposal._id}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <div className={`text-xs font-bold ${daysDiff < 3 ? 'text-red-500' : 'text-orange-500'}`}>
                                                    {daysDiff === 0 ? 'Due Today' : `${daysDiff} days left`}
                                                </div>
                                                <div className={`text-[10px] ${subTextClass}`}>{formatDate(assignment.dueDate)}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={`h-full flex flex-col items-center justify-center text-center ${isDark ? 'bg-slate-900/30' : 'bg-slate-50'} rounded-lg border ${borderClass} border-dashed`}>
                                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                    <p className={`${subTextClass} text-sm font-medium`}>No upcoming deadlines.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics - Takes 40% of left column */}
                    <div className={`${cardBaseClass} rounded-xl p-5 flex flex-col flex-1 min-h-0`}>
                        <h3 className={`text-base font-bold ${textClass} mb-4 flex items-center shrink-0`}>
                            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            Performance
                        </h3>
                        
                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className={`text-xs font-medium ${textClass}`}>On-time Submission</span>
                                    <span className="text-xs font-bold text-emerald-500">92%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className={`text-xs font-medium ${textClass}`}>Avg Review Time</span>
                                    <span className="text-xs font-bold text-blue-500">3.5 Days</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span className={`text-xs font-medium ${textClass}`}>Quality Score</span>
                                    <span className="text-xs font-bold text-purple-500">4.8/5.0</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (1/3) */}
                <div className="space-y-6">
                    {/* Recent Activity */}
                    <div className={`${cardBaseClass} rounded-xl p-5 flex flex-col flex-1 min-h-0`}>
                        <h3 className={`text-base font-bold ${textClass} mb-4 flex items-center shrink-0`}>
                            <Activity className={`w-4 h-4 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            Recent Activity
                        </h3>
                        
                        <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex gap-3">
                                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full ${isDark ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center`}>
                                        <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium ${textClass} leading-tight`}>{activity.message}</p>
                                        <p className={`text-[10px] ${subTextClass} mt-0.5`}>{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button className={`w-full mt-3 py-1.5 text-xs font-medium border ${borderClass} rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition-colors ${textClass} shrink-0`}>
                            View All Activity
                        </button>
                    </div>

                    {/* Quick Actions / Tips */}
                    <div className={`rounded-xl p-5 border shrink-0 ${isDark ? 'bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-900/50' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
                        <h3 className={`text-base font-bold ${textClass} mb-1`}>Reviewer Guidelines</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-3 leading-relaxed`}>
                            Ensure your evaluation comments are constructive and specific. Check the updated scoring criteria before submitting.
                        </p>
                        <button className="text-blue-500 text-xs font-bold hover:underline flex items-center">
                            Read Guidelines
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
