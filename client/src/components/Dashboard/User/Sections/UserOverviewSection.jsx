'use client';

import {
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    XCircle
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import MetricCard from '../../Overview/MetricCard';

// Custom Tooltip (Replicated from Admin)
const CustomBarTooltip = ({ active, payload, label, theme }) => {
    if (active && payload && payload.length) {
        const isDark = theme === 'dark' || theme === 'darkest';
        const isDarkest = theme === 'darkest';

        const bgClass = isDarkest ? 'bg-neutral-950 border-neutral-800 text-slate-300 shadow-2xl shadow-black' :
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-lg shadow-blue-900/20' :
                'bg-white border-slate-200 text-slate-900 shadow-lg shadow-slate-200/50';

        const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
        const valueColor = isDark ? 'text-blue-400' : 'text-blue-600';

        return (
            <div className={`p-4 rounded-xl border transition-opacity duration-200 ${bgClass}`}>
                <p className={`text-xs font-bold mb-1 uppercase tracking-wider ${labelColor}`}>{label}</p>
                <p className={`text-xl font-bold ${valueColor}`}>
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function UserOverviewSection({ stats, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const gridColor = isDarkest ? '#171717' : isDark ? '#334155' : '#f1f5f9';
    const axisColor = isDark ? '#94a3b8' : '#64748b';

    // Transform stats into metrics array for MetricCard
    const metrics = [
        { key: 'total', title: 'Total Proposals', value: stats.total, change: '+2', trend: 'up', icon: FileText, color: 'blue' },
        { key: 'draft', title: 'Drafts', value: stats.draft, change: '0', trend: 'neutral', icon: FileText, color: 'slate' },
        { key: 'underReview', title: 'Under Review', value: stats.underReview, change: '+1', trend: 'up', icon: Clock, color: 'amber' },
        { key: 'approved', title: 'Approved', value: stats.approved, change: '+1', trend: 'up', icon: CheckCircle, color: 'emerald' },
        { key: 'rejected', title: 'Rejected', value: stats.rejected, change: '0', trend: 'neutral', icon: XCircle, color: 'red' },
        { key: 'budget', title: 'Total Budget', value: `₹${(stats.totalBudget / 100000).toFixed(1)} L`, change: '+15%', trend: 'up', icon: DollarSign, color: 'purple' },
    ];

    // Mock Chart Data (Replace with real data if available)
    const statusData = [
        { name: 'Draft', value: stats.draft, color: '#94a3b8' },
        { name: 'Review', value: stats.underReview, color: '#f59e0b' },
        { name: 'Approved', value: stats.approved, color: '#10b981' },
        { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const trendData = [
        { name: 'Jan', value: 2 },
        { name: 'Feb', value: 3 },
        { name: 'Mar', value: 1 },
        { name: 'Apr', value: 4 },
        { name: 'May', value: 2 },
        { name: 'Jun', value: 5 },
    ];

    return (
        <div className="space-y-6">
            {/* Metrics Row */}
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {metrics.map((metric) => (
                    <div key={metric.key} className="flex-none">
                        <MetricCard metric={metric} theme={theme} />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Proposal Status Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomBarTooltip theme={theme} />} cursor={{ fill: 'transparent' }} isAnimationActive={false} animationDuration={0} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Submission Trend */}
                <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Submission Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                                <Tooltip
                                    content={<CustomBarTooltip theme={theme} />}
                                    cursor={{ fill: isDarkest ? 'rgba(255,255,255,0.03)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                    wrapperStyle={{ outline: "none" }}
                                    isAnimationActive={false}
                                    animationDuration={0}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
