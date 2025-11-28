'use client';

import { Activity, BarChart2, LineChart as LineChartIcon, Radar as RadarIcon, X } from 'lucide-react';
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
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { getMetricDetails } from '../../../utils/mockDashboardData';
import SliderControl from './SliderControl';

const CustomTooltip = ({ active, payload, label, theme }) => {
    if (active && payload && payload.length) {
        const isDark = theme === 'dark' || theme === 'darkest';
        const isDarkest = theme === 'darkest';

        const bgClass = isDarkest ? 'bg-neutral-950 border-neutral-800 text-slate-300 shadow-2xl shadow-black' :
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200 shadow-lg shadow-blue-900/20' :
                'bg-white border-slate-200 text-slate-900 shadow-lg shadow-slate-200/50';

        return (
            <div className={`p-4 rounded-xl border transition-opacity duration-200 ${bgClass}`}>
                <p className={`text-xs font-bold mb-1 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`} style={{ color: entry.color }}>
                        {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function ChartPopup({
    metric,
    isOpen,
    onClose,
    theme
}) {
    const [chartType, setChartType] = useState('bar');
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [monthRange, setMonthRange] = useState([1, 12]);
    const [valueRange, setValueRange] = useState([0, 1000]);
    const [valueBounds, setValueBounds] = useState([0, 1000]);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    useEffect(() => {
        if (isOpen && metric) {
            setLoading(true);
            getMetricDetails(metric.key).then(details => {
                const rawData = details?.chart?.data || [];
                setData(rawData);

                // Calculate bounds
                const values = rawData.map(d => d.value);
                const minVal = Math.min(...values);
                const maxVal = Math.max(...values);
                const bounds = [Math.floor(minVal * 0.9), Math.ceil(maxVal * 1.1)];

                setValueBounds(bounds);
                setValueRange(bounds);
                setMonthRange([1, 12]);

                // Set initial chart type if available
                if (details?.chart?.type) {
                    setChartType(details.chart.type);
                }

                setLoading(false);
            });
        }
    }, [isOpen, metric]);

    // Filtering Logic
    useEffect(() => {
        if (!data.length) return;

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const filtered = data.filter(item => {
            const monthIndex = months.indexOf(item.name) + 1;
            const inMonthRange = monthIndex >= monthRange[0] && monthIndex <= monthRange[1];
            const inValueRange = item.value >= valueRange[0] && item.value <= valueRange[1];
            return inMonthRange && inValueRange;
        });

        setFilteredData(filtered);
    }, [data, monthRange, valueRange]);


    if (!isOpen || !metric) return null;

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
    const axisColor = isDark ? '#94a3b8' : '#64748b';

    const commonProps = {
        data: filteredData,
        margin: { top: 20, right: 20, left: 0, bottom: 0 }
    };

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorValuePopup" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={4} fillOpacity={1} fill="url(#colorValuePopup)" />
                    </AreaChart>
                );
            case 'step':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line type="step" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'composed':
                return (
                    <ComposedChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: isDarkest ? 'rgba(255,255,255,0.03)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="value" fill={color} fillOpacity={0.6} barSize={60} radius={[8, 8, 0, 0]} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                );
            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={filteredData}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: axisColor }} />
                        <Radar name={metric.title} dataKey="value" stroke={color} fill={color} fillOpacity={0.5} />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                    </RadarChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: isDarkest ? 'rgba(255,255,255,0.03)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
                    </BarChart>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border
                ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
            `}>

                {/* Header */}
                <div className={`px-8 py-6 border-b flex items-center justify-between shrink-0
                    ${isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-800' : 'border-slate-100'}
                `}>
                    <div>
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {metric.title}
                        </h2>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Detailed Analysis & Filtering
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors
                            ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}
                        `}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 min-h-0">
                    {/* Main Chart Area */}
                    <div className="flex-1 flex flex-col p-8 min-w-0">
                        {/* Chart Type Tabs */}
                        <div className={`flex items-center gap-2 mb-6 p-1 rounded-xl w-fit border flex-wrap
                            ${isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}
                        `}>
                            {[
                                { id: 'bar', icon: BarChart2, label: 'Bar' },
                                { id: 'line', icon: LineChartIcon, label: 'Line' },
                                { id: 'area', icon: Activity, label: 'Area' },
                                { id: 'step', icon: Activity, label: 'Step' },
                                { id: 'composed', icon: BarChart2, label: 'Mixed' },
                                { id: 'radar', icon: RadarIcon, label: 'Radar' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setChartType(type.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                        ${chartType === type.id
                                            ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white text-blue-600 shadow-sm')
                                            : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
                                    `}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="flex-1 w-full min-h-0">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {renderChart()}
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Filters */}
                    <div className={`w-80 border-l p-6 shrink-0 overflow-y-auto
                        ${isDarkest ? 'border-neutral-800 bg-neutral-900/30' : isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}
                    `}>
                        <h3 className={`font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Data Filters</h3>

                        <div className="space-y-8">
                            <SliderControl
                                label="Month Range"
                                min={1}
                                max={12}
                                value={monthRange}
                                onChange={setMonthRange}
                                theme={theme}
                            />

                            <SliderControl
                                label="Value Range"
                                min={valueBounds[0]}
                                max={valueBounds[1]}
                                value={valueRange}
                                onChange={setValueRange}
                                theme={theme}
                            />
                        </div>

                        <div className={`mt-8 p-4 rounded-xl border
                            ${isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                        `}>
                            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current View</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Records</span>
                                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{filteredData.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Avg Value</span>
                                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {Math.round(filteredData.reduce((acc, curr) => acc + curr.value, 0) / (filteredData.length || 1)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
