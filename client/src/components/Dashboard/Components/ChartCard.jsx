'use client';

import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Line,
    LineChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    XAxis,
    YAxis
} from 'recharts';
import { getMetricDetails } from '../../../utils/mockDashboardData';

export default function ChartCard({ metric, onClick, theme, forcedChartType }) {
    const [data, setData] = useState([]);
    const [chartType, setChartType] = useState('bar');
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        // If metric.data is provided (e.g. filtered data), use it directly
        if (metric.data) {
            setData(metric.data);
            if (forcedChartType) {
                setChartType(forcedChartType);
            } else if (metric.chartType) {
                setChartType(metric.chartType);
            } else {
                // Fallback or default
                setChartType('bar');
            }
            setLoading(false);
            return;
        }

        getMetricDetails(metric.key).then(details => {
            if (mounted) {
                setData(details?.chart?.data || []);
                if (forcedChartType) {
                    setChartType(forcedChartType);
                } else if (details?.chart?.type) {
                    setChartType(details.chart.type);
                }
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, [metric, forcedChartType]); // Added metric dependency to trigger update on data change

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
        violet: '#8b5cf6',
        fuchsia: '#d946ef',
        rose: '#f43f5e',
        lime: '#84cc16',
        sky: '#0ea5e9',
    };
    const color = chartColors[metric.color] || '#3b82f6';
    const gridColor = isDarkest ? '#171717' : isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#64748b' : '#94a3b8';

    const containerStyles = {
        blue: 'border-blue-100 shadow-blue-100/50',
        emerald: 'border-emerald-100 shadow-emerald-100/50',
        red: 'border-red-100 shadow-red-100/50',
        green: 'border-green-100 shadow-green-100/50',
        indigo: 'border-indigo-100 shadow-indigo-100/50',
        purple: 'border-purple-100 shadow-purple-100/50',
        cyan: 'border-cyan-100 shadow-cyan-100/50',
        orange: 'border-orange-100 shadow-orange-100/50',
        amber: 'border-amber-100 shadow-amber-100/50',
        teal: 'border-teal-100 shadow-teal-100/50',
        pink: 'border-pink-100 shadow-pink-100/50',
        violet: 'border-violet-100 shadow-violet-100/50',
        fuchsia: 'border-fuchsia-100 shadow-fuchsia-100/50',
        rose: 'border-rose-100 shadow-rose-100/50',
        lime: 'border-lime-100 shadow-lime-100/50',
        sky: 'border-sky-100 shadow-sky-100/50',
    };

    const darkContainerStyles = {
        blue: 'border-blue-900/30 shadow-blue-900/10 bg-slate-800',
        emerald: 'border-emerald-900/30 shadow-emerald-900/10 bg-slate-800',
        red: 'border-red-900/30 shadow-red-900/10 bg-slate-800',
        green: 'border-green-900/30 shadow-green-900/10 bg-slate-800',
        indigo: 'border-indigo-900/30 shadow-indigo-900/10 bg-slate-800',
        purple: 'border-purple-900/30 shadow-purple-900/10 bg-slate-800',
        cyan: 'border-cyan-900/30 shadow-cyan-900/10 bg-slate-800',
        orange: 'border-orange-900/30 shadow-orange-900/10 bg-slate-800',
        amber: 'border-amber-900/30 shadow-amber-900/10 bg-slate-800',
        teal: 'border-teal-900/30 shadow-teal-900/10 bg-slate-800',
        pink: 'border-pink-900/30 shadow-pink-900/10 bg-slate-800',
        violet: 'border-violet-900/30 shadow-violet-900/10 bg-slate-800',
        fuchsia: 'border-fuchsia-900/30 shadow-fuchsia-900/10 bg-slate-800',
        rose: 'border-rose-900/30 shadow-rose-900/10 bg-slate-800',
        lime: 'border-lime-900/30 shadow-lime-900/10 bg-slate-800',
        sky: 'border-sky-900/30 shadow-sky-900/10 bg-slate-800',
    };

    const darkestContainerStyles = {
        blue: 'border-blue-900/20 shadow-none bg-neutral-900',
        emerald: 'border-emerald-900/20 shadow-none bg-neutral-900',
        red: 'border-red-900/20 shadow-none bg-neutral-900',
        green: 'border-green-900/20 shadow-none bg-neutral-900',
        indigo: 'border-indigo-900/20 shadow-none bg-neutral-900',
        purple: 'border-purple-900/20 shadow-none bg-neutral-900',
        cyan: 'border-cyan-900/20 shadow-none bg-neutral-900',
        orange: 'border-orange-900/20 shadow-none bg-neutral-900',
        amber: 'border-amber-900/20 shadow-none bg-neutral-900',
        teal: 'border-teal-900/20 shadow-none bg-neutral-900',
        pink: 'border-pink-900/20 shadow-none bg-neutral-900',
        violet: 'border-violet-900/20 shadow-none bg-neutral-900',
        fuchsia: 'border-fuchsia-900/20 shadow-none bg-neutral-900',
        rose: 'border-rose-900/20 shadow-none bg-neutral-900',
        lime: 'border-lime-900/20 shadow-none bg-neutral-900',
        sky: 'border-sky-900/20 shadow-none bg-neutral-900',
    };

    const getContainerStyle = () => {
        if (isDarkest) return darkestContainerStyles[metric.color] || darkestContainerStyles.blue;
        if (isDark) return darkContainerStyles[metric.color] || darkContainerStyles.blue;
        return containerStyles[metric.color] || containerStyles.blue;
    };

    const commonProps = {
        data: data,
        margin: { top: 5, right: 5, left: -20, bottom: 0 }
    };

    const renderChart = () => {
        switch (chartType) {
            case 'line':
            case 'step':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} dy={5} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                        <Line type={chartType === 'step' ? 'step' : 'monotone'} dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id={`colorValue-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} dy={5} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#colorValue-${metric.key})`} />
                    </AreaChart>
                );
            case 'composed':
                return (
                    <ComposedChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} dy={5} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                        <Bar dataKey="value" fill={color} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                    </ComposedChart>
                );
            case 'radar':
                // Calculate min/max for highlighting
                const values = data.map(d => d.value);
                const maxValue = Math.max(...values);
                const minValue = Math.min(...values);

                const renderCustomDot = (props) => {
                    const { cx, cy, payload } = props;
                    const isMax = payload.value === maxValue;
                    const isMin = payload.value === minValue;

                    if (!isMax && !isMin) return null;

                    return (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            stroke={isMax ? '#22c55e' : '#ef4444'} // Green for max, Red for min
                            strokeWidth={2}
                            fill={isDark ? '#1e293b' : '#ffffff'}
                        />
                    );
                };

                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: 8 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                            name={metric.title}
                            dataKey="value"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.5}
                            dot={renderCustomDot}
                        />
                    </RadarChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} dy={5} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 10 }} />
                        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                );
        }
    };

    return (
        <div
            onClick={onClick}
            className={`relative flex flex-col rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] overflow-hidden
                ${getContainerStyle()}
            `}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {metric.title}
                </h3>
                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: color }}></div>
            </div>

            <div className="flex-1 min-h-0 relative pointer-events-none">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color} transparent transparent transparent` }}></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
