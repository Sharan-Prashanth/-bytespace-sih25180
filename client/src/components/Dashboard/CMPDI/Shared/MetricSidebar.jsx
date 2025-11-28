'use client';

import { Check, RotateCcw } from 'lucide-react';

export default function MetricSidebar({
    allMetrics = [],
    selectedMetrics = [],
    toggleMetric,
    resetMetrics,
    theme
}) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    // Color mapping for selected backgrounds and borders
    const containerStyles = {
        blue: 'bg-blue-50 border-blue-200',
        emerald: 'bg-emerald-50 border-emerald-200',
        red: 'bg-red-50 border-red-200',
        green: 'bg-green-50 border-green-200',
        indigo: 'bg-indigo-50 border-indigo-200',
        purple: 'bg-purple-50 border-purple-200',
        cyan: 'bg-cyan-50 border-cyan-200',
        orange: 'bg-orange-50 border-orange-200',
        amber: 'bg-amber-50 border-amber-200',
        teal: 'bg-teal-50 border-teal-200',
        pink: 'bg-pink-50 border-pink-200',
    };

    const darkContainerStyles = {
        blue: 'bg-blue-900/30 border-blue-800',
        emerald: 'bg-emerald-900/30 border-emerald-800',
        red: 'bg-red-900/30 border-red-800',
        green: 'bg-green-900/30 border-green-800',
        indigo: 'bg-indigo-900/30 border-indigo-800',
        purple: 'bg-purple-900/30 border-purple-800',
        cyan: 'bg-cyan-900/30 border-cyan-800',
        orange: 'bg-orange-900/30 border-orange-800',
        amber: 'bg-amber-900/30 border-amber-800',
        teal: 'bg-teal-900/30 border-teal-800',
        pink: 'bg-pink-900/30 border-pink-800',
    };

    const darkestContainerStyles = {
        blue: 'bg-neutral-900 border-neutral-800',
        emerald: 'bg-neutral-900 border-neutral-800',
        red: 'bg-neutral-900 border-neutral-800',
        green: 'bg-neutral-900 border-neutral-800',
        indigo: 'bg-neutral-900 border-neutral-800',
        purple: 'bg-neutral-900 border-neutral-800',
        cyan: 'bg-neutral-900 border-neutral-800',
        orange: 'bg-neutral-900 border-neutral-800',
        amber: 'bg-neutral-900 border-neutral-800',
        teal: 'bg-neutral-900 border-neutral-800',
        pink: 'bg-neutral-900 border-neutral-800',
    };

    // Color mapping for checkbox backgrounds and borders
    const checkboxStyles = {
        blue: 'bg-blue-600 border-blue-600',
        emerald: 'bg-emerald-600 border-emerald-600',
        red: 'bg-red-600 border-red-600',
        green: 'bg-green-600 border-green-600',
        indigo: 'bg-indigo-600 border-indigo-600',
        purple: 'bg-purple-600 border-purple-600',
        cyan: 'bg-cyan-600 border-cyan-600',
        orange: 'bg-orange-600 border-orange-600',
        amber: 'bg-amber-600 border-amber-600',
        teal: 'bg-teal-600 border-teal-600',
        pink: 'bg-pink-600 border-pink-600',
    };

    // Text color mapping
    const textStyles = {
        blue: 'text-blue-900',
        emerald: 'text-emerald-900',
        red: 'text-red-900',
        green: 'text-green-900',
        indigo: 'text-indigo-900',
        purple: 'text-purple-900',
        cyan: 'text-cyan-900',
        orange: 'text-orange-900',
        amber: 'text-amber-900',
        teal: 'text-teal-900',
        pink: 'text-pink-900',
    };

    const darkTextStyles = {
        blue: 'text-blue-300',
        emerald: 'text-emerald-300',
        red: 'text-red-300',
        green: 'text-green-300',
        indigo: 'text-indigo-300',
        purple: 'text-purple-300',
        cyan: 'text-cyan-300',
        orange: 'text-orange-300',
        amber: 'text-amber-300',
        teal: 'text-teal-300',
        pink: 'text-pink-300',
    };

    const getContainerClass = () => {
        if (isDarkest) return 'bg-black border-neutral-900';
        if (isDark) return 'bg-slate-900 border-slate-800';
        return 'bg-white border-slate-100';
    };

    return (
        <div className={`w-72 border-l flex flex-col hidden xl:flex shrink-0 rounded-l-3xl transition-colors duration-300 h-full ${getContainerClass()}`}>

            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${isDarkest ? 'border-neutral-900' : isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                <div>
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Dashboard Metrics</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select up to 4 metrics to display</p>
                </div>

                {/* Reset Button */}
                <button
                    onClick={resetMetrics}
                    className={`p-2 rounded-lg transition 
                        ${isDarkest ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300' :
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' :
                                'bg-slate-100 hover:bg-slate-200 text-slate-700'}
                    `}
                    title="Reset Metrics"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                    {allMetrics.map((metric) => {
                        const isSelected = selectedMetrics.includes(metric.key);
                        const color = metric.color || 'blue';

                        const getMetricStyle = () => {
                            if (isSelected) {
                                if (isDarkest) return darkestContainerStyles[color] || darkestContainerStyles.blue;
                                if (isDark) return darkContainerStyles[color] || darkContainerStyles.blue;
                                return containerStyles[color] || containerStyles.blue;
                            }
                            if (isDarkest) return 'bg-black border-neutral-900 hover:bg-neutral-900 hover:border-neutral-800';
                            if (isDark) return 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700';
                            return 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300';
                        };

                        return (
                            <div
                                key={metric.key}
                                onClick={() => toggleMetric(metric.key)}
                                className={`
                                    flex items-center justify-between px-3 py-2 rounded-2xl border cursor-pointer 
                                    transition-all text-sm duration-200
                                    ${getMetricStyle()}
                                `}
                            >
                                {/* Title */}
                                <span className={`font-medium ${isSelected
                                    ? (isDark ? (darkTextStyles[color] || 'text-slate-100') : (textStyles[color] || 'text-slate-900'))
                                    : (isDark ? 'text-slate-400' : 'text-slate-600')
                                    }`}>
                                    {metric.title}
                                </span>

                                {/* Checkbox */}
                                <div
                                    className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200
                                        ${isSelected
                                            ? `${checkboxStyles[color] || checkboxStyles.blue} text-white`
                                            : (isDarkest ? 'border-neutral-800 bg-neutral-900' : isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white')
                                        }
                                    `}
                                >
                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
