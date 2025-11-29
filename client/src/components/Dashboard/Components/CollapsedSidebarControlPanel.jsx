'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import SliderControl from './SliderControl';

export default function CollapsedSidebarControlPanel({
    metrics,
    selectedMetrics,
    onMetricSelect,
    onValueChange,
    onMonthChange,
    theme
}) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const [selectedKey, setSelectedKey] = useState(selectedMetrics[0]);

    // Default ranges
    const [monthRange, setMonthRange] = useState([1, 12]);
    const [valueRange, setValueRange] = useState([0, 1000]);

    // Dynamic constraints based on selected metric
    const [minVal, setMinVal] = useState(0);
    const [maxVal, setMaxVal] = useState(1000);
    const [maxTime, setMaxTime] = useState(12);

    // Update local state when active metric changes externally or on mount
    useEffect(() => {
        if (selectedMetrics.length > 0 && !selectedMetrics.includes(selectedKey)) {
            setSelectedKey(selectedMetrics[0]);
        }
    }, [selectedMetrics]);

    // Update dynamic ranges when selected metric changes
    useEffect(() => {
        const metric = metrics.find(m => m.key === selectedKey);
        if (metric && metric.data) {
            // Calculate value range
            const values = metric.data.map(d => d.value);
            const min = Math.min(...values);
            const max = Math.max(...values);

            // Add some padding
            const padding = Math.round((max - min) * 0.1);
            const newMin = Math.max(0, min - padding);
            const newMax = max + padding;

            setMinVal(newMin);
            setMaxVal(newMax);
            setValueRange([newMin, newMax]);
            onValueChange([newMin, newMax]); // Reset parent filter

            // Calculate time range (e.g., 12 months or 30 days)
            const timeLength = metric.data.length;
            setMaxTime(timeLength);
            setMonthRange([1, timeLength]);
            onMonthChange([1, timeLength]); // Reset parent filter
        }
    }, [selectedKey, metrics]);

    const handleMetricChange = (e) => {
        const key = e.target.value;
        setSelectedKey(key);
        const metric = metrics.find(m => m.key === key);
        onMetricSelect(metric);
    };

    const handleValueChange = (val) => {
        setValueRange(val);
        onValueChange(val);
    };

    const handleMonthChange = (val) => {
        setMonthRange(val);
        onMonthChange(val);
    };

    // Styles
    const containerClass = 'bg-transparent'; // Transparent since it lives inside sidebar
    const textClass = isDark ? 'text-slate-200' : 'text-slate-700';
    const labelClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const selectBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200';

    return (
        <div className={`h-full w-full flex flex-col gap-6 px-1 pt-30 ${containerClass}`}>

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>
                    Controls
                </span>
            </div>

            {/* Dropdown */}
            <div>
                <label className={`text-xs font-medium mb-1.5 block ${labelClass}`}>Active Metric</label>
                <div className="relative">
                    <select
                        value={selectedKey}
                        onChange={handleMetricChange}
                        className={`w-full appearance-none rounded-xl px-3 py-2 text-sm font-medium border outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${selectBg} ${textClass}`}
                    >
                        {selectedMetrics.map(key => {
                            const metric = metrics.find(m => m.key === key);
                            return (
                                <option key={key} value={key}>
                                    {metric?.title || key}
                                </option>
                            );
                        })}
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${labelClass}`} />
                </div>
            </div>

            {/* Sliders */}
            <div className="flex-1 flex flex-col gap-8 pt-2">
                <SliderControl
                    label="Value Range"
                    min={minVal}
                    max={maxVal}
                    value={valueRange}
                    onChange={handleValueChange}
                    theme={theme}
                    variant="neon"
                    compact
                />
                <SliderControl
                    label="Time Range"
                    min={1}
                    max={maxTime}
                    value={monthRange}
                    onChange={handleMonthChange}
                    theme={theme}
                    variant="neon"
                    compact
                />
            </div>
        </div>
    );
}
