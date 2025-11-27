import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';
import { getMetricDetails } from '../../../utils/mockDashboardData';
import MetricCard from '../Overview/MetricCard';
import RightSidebar from '../Sidebar/RightSidebar';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                <p className="text-sm font-bold mb-1">{label}</p>
                <p className="text-lg font-bold text-blue-400">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function OverviewSection({
    metrics,
    activeMetric,
    onMetricClick,
    allMetrics,
    selectedMetrics,
    toggleMetric,
    resetMetrics
}) {
    const [metricDetails, setMetricDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (activeMetric) {
                setLoading(true);
                try {
                    const details = await getMetricDetails(activeMetric.key);
                    setMetricDetails(details);
                } catch (error) {
                    console.error("Failed to fetch details", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [activeMetric]);

    const renderChart = () => {
        if (!metricDetails || !metricDetails.chart) return null;

        const { chart } = metricDetails;
        const commonProps = {
            data: chart.data,
            margin: { top: 10, right: 10, left: 0, bottom: 0 }
        };

        // Hex color mapping for charts
        const chartColors = {
            blue: '#3b82f6',
            emerald: '#10b981',
            red: '#ef4444',
            green: '#22c55e',
            indigo: '#6366f1',
            purple: '#a855f7',
            cyan: '#06b6d4',
            orange: '#f97316',
            amber: '#f59e0b',
            teal: '#14b8a6',
            pink: '#ec4899',
        };

        const color = chartColors[activeMetric?.color] || "#3b82f6"; // Default to blue

        switch (chart.type) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                );
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Top Row - Fixed Metrics */}
            <div className="flex items-center gap-6 shrink-0 overflow-hidden min-h-[180px] pl-1">
                {metrics.map((metric) => (
                    <MetricCard
                        key={metric.key}
                        metric={metric}
                        isActive={activeMetric?.key === metric.key}
                        onClick={() => onMetricClick(metric)}
                    />
                ))}
                {/* Placeholders to maintain layout if < 5 */}
                {Array.from({ length: 5 - metrics.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="min-w-[240px] w-[240px] h-[140px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/50" />
                ))}
            </div>

            {/* Bottom Section: Chart + Sidebar */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Chart Area */}
                <div className="flex-1 min-w-0 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {activeMetric ? activeMetric.title : 'Select a Metric'}
                            </h2>
                            <p className="text-sm text-slate-500">Performance Analytics</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart() || <div />}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Sidebar - Metrics Selection */}
                <div className="w-80 shrink-0 h-full">
                    <RightSidebar
                        allMetrics={allMetrics}
                        selectedMetrics={selectedMetrics}
                        toggleMetric={toggleMetric}
                        resetMetrics={resetMetrics}
                    />
                </div>
            </div>
        </div>
    );
}
