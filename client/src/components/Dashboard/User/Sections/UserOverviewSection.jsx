'use client';

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    CheckCircle,
    Clock,
    Edit,
    FileText,
    Plus,
    XCircle
} from "lucide-react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import MetricCard from '../../Overview/MetricCard';
import { PROPOSAL_STATUS, STATUS_CONFIG } from '../../../../utils/statusConfig';

// Custom label renderer for pie chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
        <text 
            x={x} 
            y={y} 
            fill="#000000" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            className="text-xs font-bold"
        >
            {value}
        </text>
    );
};

export default function UserOverviewSection({ stats, theme, proposals = [], lastDraft }) {
    const router = useRouter();
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';
    
    // Animation states
    const [isLoaded, setIsLoaded] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const [showRecentActivity, setShowRecentActivity] = useState(false);

    useEffect(() => {
        // Stagger the animations
        const loadTimer = setTimeout(() => setIsLoaded(true), 100);
        const chartTimer = setTimeout(() => setShowChart(true), 400);
        const activityTimer = setTimeout(() => setShowRecentActivity(true), 600);
        
        return () => {
            clearTimeout(loadTimer);
            clearTimeout(chartTimer);
            clearTimeout(activityTimer);
        };
    }, []);

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';

    // Transform stats into metrics array for MetricCard
    const metrics = [
        { key: 'total', title: 'Total Proposals', value: stats.total || 0, change: '', trend: 'neutral', icon: FileText, color: 'blue' },
        { key: 'draft', title: 'Drafts', value: stats.draft || 0, change: '', trend: 'neutral', icon: FileText, color: 'amber' },
        { key: 'underReview', title: 'Under Review', value: stats.underReview || 0, change: '', trend: 'neutral', icon: Clock, color: 'cyan' },
        { key: 'approved', title: 'Approved', value: stats.approved || 0, change: '', trend: 'neutral', icon: CheckCircle, color: 'emerald' },
        { key: 'rejected', title: 'Rejected', value: stats.rejected || 0, change: '', trend: 'neutral', icon: XCircle, color: 'red' },
    ];

    // Chart Data
    const statusData = [
        { name: 'Draft', value: stats.draft || 0, color: '#94a3b8' },
        { name: 'Review', value: stats.underReview || 0, color: '#f59e0b' },
        { name: 'Approved', value: stats.approved || 0, color: '#10b981' },
        { name: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Get recent proposals - only those updated in the last week (top 3)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentProposals = [...proposals]
        .filter(p => new Date(p.updatedAt) >= oneWeekAgo)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Quick Actions - Compact */}
            <div className={`${cardBg} px-5 py-3 rounded-xl shadow-sm border flex items-center justify-between transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className={`text-sm font-bold ${textColor}`}>Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => router.push('/proposal/create')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/20 font-bold text-xs hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={14} />
                        <span>New Proposal</span>
                    </button>
                    {lastDraft && (
                        <button
                            onClick={() => router.push(`/proposal/create?draft=${lastDraft._id}`)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs border hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-amber-900/20 text-amber-400 border-amber-900/50 hover:bg-amber-900/40' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                        >
                            <Edit size={14} />
                            <span>Continue Last Draft</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics Row - Grid layout with staggered animation */}
            <div className="grid grid-cols-5 gap-4">
                {metrics.map((metric, index) => (
                    <MetricCard 
                        key={metric.key} 
                        metric={metric} 
                        theme={theme} 
                        animationDelay={150 + (index * 80)}
                    />
                ))}
            </div>

            {/* Charts and Recent Proposals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Status Distribution */}
                <div className={`p-4 rounded-xl shadow-sm border ${cardBg} flex flex-col overflow-hidden transition-all duration-700 ${showChart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h3 className={`text-sm font-bold mb-2 ${textColor}`}>Status Distribution</h3>
                    {statusData.length > 0 ? (
                        <div className="flex-1 min-h-0 -mx-2 -mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={renderCustomLabel}
                                        labelLine={false}
                                        animationBegin={0}
                                        animationDuration={1200}
                                        animationEasing="ease-out"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name]} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={28} 
                                        iconType="circle" 
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                                        formatter={(value) => <span className={`text-xs ${textColor}`}>{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <FileText className={`w-8 h-8 mx-auto mb-2 ${subTextColor} opacity-50`} />
                                <p className={`text-xs ${subTextColor}`}>No proposals yet</p>
                                <button
                                    onClick={() => router.push('/proposal/create')}
                                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-xs"
                                >
                                    Create your first proposal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Proposals (Last Week) */}
                <div className={`p-4 rounded-xl shadow-sm border ${cardBg} flex flex-col transition-all duration-700 ${showRecentActivity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm font-bold ${textColor}`}>Recent Activity (Last 7 Days)</h3>
                        {proposals.length > 3 && (
                            <button 
                                onClick={() => router.push('/dashboard?section=proposals')}
                                className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                            >
                                View All <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                    {recentProposals.length > 0 ? (
                        <div className="space-y-2.5 flex-1 overflow-y-auto">
                            {recentProposals.map((proposal, index) => {
                                const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG[PROPOSAL_STATUS.DRAFT];
                                return (
                                    <div
                                        key={proposal._id}
                                        onClick={() => {
                                            if (proposal.status === PROPOSAL_STATUS.DRAFT || proposal.status === PROPOSAL_STATUS.AI_VALIDATION_FAILED) {
                                                router.push(`/proposal/create?draft=${proposal._id}`);
                                            } else {
                                                router.push(`/proposal/view/${proposal._id}`);
                                            }
                                        }}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-[1.01] ${isDarkest ? 'border-neutral-800 hover:bg-neutral-800' : isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}
                                        style={{
                                            opacity: showRecentActivity ? 1 : 0,
                                            transform: showRecentActivity ? 'translateX(0)' : 'translateX(20px)',
                                            transition: `all 0.4s ease-out ${index * 100 + 200}ms`
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`text-xs font-bold ${textColor}`}>{proposal.proposalCode || 'No ID'}</span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig?.color || 'bg-slate-100 text-black border-slate-200'}`}>
                                                {statusConfig?.label || proposal.status}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-medium ${textColor} line-clamp-1`}>{proposal.title}</p>
                                        <p className={`text-[10px] mt-1 ${subTextColor}`}>
                                            Updated {new Date(proposal.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <FileText className={`w-8 h-8 mx-auto mb-2 ${subTextColor} opacity-50`} />
                                <p className={`text-xs ${subTextColor}`}>No recent activity</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
