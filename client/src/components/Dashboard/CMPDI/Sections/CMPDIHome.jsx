'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Activity, BarChart2, ChevronDown, Download, LineChart as LineChartIcon } from 'lucide-react';
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
import { getCMPDIMetricDetails } from '../../../../utils/cmpdiMock/metrics';
import MetricCard from '../Shared/MetricCard';
import MetricSidebar from '../Shared/MetricSidebar';

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

export default function CMPDIHome({
    metrics,
    activeMetric,
    onMetricClick,
    allMetrics,
    selectedMetrics,
    toggleMetric,
    resetMetrics,
    theme
}) {
    const [metricDetails, setMetricDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedChartType, setSelectedChartType] = useState('area');
    const [isExporting, setIsExporting] = useState(false);
    const [showChartMenu, setShowChartMenu] = useState(false);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    useEffect(() => {
        const fetchDetails = async () => {
            if (activeMetric) {
                setLoading(true);
                try {
                    const details = await getCMPDIMetricDetails(activeMetric.key);
                    setMetricDetails(details);
                    if (details?.chart?.type) {
                        setSelectedChartType(details.chart.type);
                    }
                } catch (error) {
                    console.error("Failed to fetch details", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [activeMetric]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('chart-container');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: isDarkest ? '#000000' : isDark ? '#0f172a' : '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 30;

            pdf.setFontSize(16);
            pdf.text(`Dashboard Report: ${activeMetric?.title || 'Overview'}`, 10, 20);
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`cmpdi-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const renderChart = () => {
        if (!metricDetails || !metricDetails.chart) return null;

        const { chart } = metricDetails;
        const commonProps = {
            data: chart.data,
            margin: { top: 10, right: 10, left: 0, bottom: 0 }
        };

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

        const color = chartColors[activeMetric?.color] || "#3b82f6";
        const gridColor = isDarkest ? '#171717' : isDark ? '#334155' : '#f1f5f9';
        const axisColor = isDark ? '#94a3b8' : '#64748b';

        switch (selectedChartType) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                        <Tooltip content={<CustomBarTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} animationDuration={0} />
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                        <Tooltip content={<CustomBarTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} animationDuration={0} />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'step':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                        <Tooltip content={<CustomBarTooltip theme={theme} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} animationDuration={0} />
                        <Line type="step" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps} barSize={40}>
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
                        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                );
        }
    };

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
    };

    const darkContainerStyles = {
        blue: 'border-blue-900/50 shadow-blue-900/20 bg-slate-800',
        emerald: 'border-emerald-900/50 shadow-emerald-900/20 bg-slate-800',
        red: 'border-red-900/50 shadow-red-900/20 bg-slate-800',
        green: 'border-green-900/50 shadow-green-900/20 bg-slate-800',
        indigo: 'border-indigo-900/50 shadow-indigo-900/20 bg-slate-800',
        purple: 'border-purple-900/50 shadow-purple-900/20 bg-slate-800',
        cyan: 'border-cyan-900/50 shadow-cyan-900/20 bg-slate-800',
        orange: 'border-orange-900/50 shadow-orange-900/20 bg-slate-800',
        amber: 'border-amber-900/50 shadow-amber-900/20 bg-slate-800',
        teal: 'border-teal-900/50 shadow-teal-900/20 bg-slate-800',
        pink: 'border-pink-900/50 shadow-pink-900/20 bg-slate-800',
    };

    const darkestContainerStyles = {
        blue: 'border-blue-900/30 shadow-none bg-neutral-950',
        emerald: 'border-emerald-900/30 shadow-none bg-neutral-950',
        red: 'border-red-900/30 shadow-none bg-neutral-950',
        green: 'border-green-900/30 shadow-none bg-neutral-950',
        indigo: 'border-indigo-900/30 shadow-none bg-neutral-950',
        purple: 'border-purple-900/30 shadow-none bg-neutral-950',
        cyan: 'border-cyan-900/30 shadow-none bg-neutral-950',
        orange: 'border-orange-900/30 shadow-none bg-neutral-950',
        amber: 'border-amber-900/30 shadow-none bg-neutral-950',
        teal: 'border-teal-900/30 shadow-none bg-neutral-950',
        pink: 'border-pink-900/30 shadow-none bg-neutral-950',
    };

    const getActiveContainerStyle = () => {
        if (!activeMetric) return isDarkest ? 'border-neutral-900 bg-neutral-950' : isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-100 bg-white';

        if (isDarkest) return darkestContainerStyles[activeMetric.color] || darkestContainerStyles.blue;
        if (isDark) return darkContainerStyles[activeMetric.color] || darkContainerStyles.blue;
        return containerStyles[activeMetric.color] || containerStyles.blue;
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
                        theme={theme}
                    />
                ))}
                {/* Placeholders to maintain layout if < 5 */}
                {Array.from({ length: 5 - metrics.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className={`min-w-[240px] w-[240px] h-[140px] rounded-2xl border border-dashed 
                        ${isDarkest ? 'border-neutral-800 bg-neutral-900/50' :
                            isDark ? 'border-slate-700 bg-slate-800/50' :
                                'border-slate-200 bg-slate-50/50'}
                    `} />
                ))}
            </div>

            {/* Bottom Section: Chart + Sidebar */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Chart Area */}
                <div
                    id="chart-container"
                    className={`flex-1 min-w-0 rounded-3xl border p-6 shadow-sm flex flex-col relative overflow-hidden transition-colors duration-300
                    ${getActiveContainerStyle()}
                `}>
                    {loading && (
                        <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkest ? 'bg-black/80' : isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {activeMetric ? activeMetric.title : 'Select a Metric'}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CMPDI Performance Analytics</p>
                        </div>

                        {/* Chart Controls */}
                        <div className="flex items-center gap-2">
                            {/* Chart Type Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowChartMenu(!showChartMenu)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                                        ${isDarkest ? 'bg-neutral-900 border-neutral-800 text-slate-300 hover:bg-neutral-800' :
                                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' :
                                                'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {selectedChartType === 'area' && <Activity size={14} />}
                                    {selectedChartType === 'line' && <LineChartIcon size={14} />}
                                    {selectedChartType === 'bar' && <BarChart2 size={14} />}
                                    {selectedChartType === 'step' && <Activity size={14} />}
                                    <span className="capitalize">{selectedChartType} Chart</span>
                                    <ChevronDown size={14} className={`transition-transform ${showChartMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showChartMenu && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowChartMenu(false)} />
                                        <div className={`absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl border z-30 overflow-hidden
                                            ${isDarkest ? 'bg-neutral-900 border-neutral-800' :
                                                isDark ? 'bg-slate-800 border-slate-700' :
                                                    'bg-white border-slate-200'}
                                        `}>
                                            {[
                                                { type: 'area', label: 'Area Chart', icon: Activity },
                                                { type: 'line', label: 'Line Chart', icon: LineChartIcon },
                                                { type: 'bar', label: 'Bar Chart', icon: BarChart2 },
                                                { type: 'step', label: 'Step Chart', icon: Activity },
                                            ].map((option) => (
                                                <button
                                                    key={option.type}
                                                    onClick={() => {
                                                        setSelectedChartType(option.type);
                                                        setShowChartMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                                                        ${selectedChartType === option.type
                                                            ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                                                            : (isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}
                                                    `}
                                                >
                                                    <option.icon size={14} />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isExporting}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                                    ${isDarkest ? 'bg-neutral-900 border-neutral-800 text-slate-300 hover:bg-neutral-800' :
                                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' :
                                            'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                    ${isExporting ? 'opacity-50 cursor-wait' : ''}
                                `}
                                title="Export as PDF"
                            >
                                <Download size={14} />
                                <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
                            </button>
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
                    <MetricSidebar
                        allMetrics={allMetrics}
                        selectedMetrics={selectedMetrics}
                        toggleMetric={toggleMetric}
                        resetMetrics={resetMetrics}
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
}
