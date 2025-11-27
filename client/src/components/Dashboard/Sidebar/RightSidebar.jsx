'use client';

import { Check, RotateCcw } from 'lucide-react';

export default function RightSidebar({
    allMetrics = [],
    selectedMetrics = [],
    toggleMetric,
    resetMetrics
}) {
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

    return (
        <div className="w-72 bg-white border-l border-slate-100 flex flex-col hidden xl:flex shrink-0 rounded-l-3xl">

            {/* Header */}
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Dashboard Metrics</h3>
                    <p className="text-sm text-slate-500 mt-1">Select up to 5 metrics to display</p>
                </div>

                {/* Reset Button */}
                <button
                    onClick={resetMetrics}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                    title="Reset Metrics"
                >
                    <RotateCcw size={16} className="text-slate-700" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[calc(65vh-160px)]">
                <div className="space-y-2">
                    {allMetrics.map((metric) => {
                        const isSelected = selectedMetrics.includes(metric.key);
                        const color = metric.color || 'blue';

                        return (
                            <div
                                key={metric.key}
                                onClick={() => toggleMetric(metric.key)}
                                className={`
                                    flex items-center justify-between px-3 py-2 rounded-2xl border cursor-pointer 
                                    transition-all text-sm duration-200
                                    ${isSelected
                                        ? `${containerStyles[color] || containerStyles.blue}`
                                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                    }
                                `}
                            >
                                {/* Title */}
                                <span className={`font-medium ${isSelected ? (textStyles[color] || 'text-slate-900') : 'text-slate-600'}`}>
                                    {metric.title}
                                </span>

                                {/* Checkbox */}
                                <div
                                    className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200
                                        ${isSelected
                                            ? `${checkboxStyles[color] || checkboxStyles.blue} text-white`
                                            : 'border-slate-300 bg-white'
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
