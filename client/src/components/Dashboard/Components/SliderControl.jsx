'use client';

import { useEffect, useRef, useState } from 'react';

export default function SliderControl({
    min,
    max,
    value = [min, max],
    onChange,
    label,
    theme,
    variant = 'neon', // 'default' | 'neon'
    formatValue = (v) => v
}) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const [localValue, setLocalValue] = useState(value);
    const sliderRef = useRef(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Calculate percentage for positioning
    const getPercent = (v) => Math.round(((v - min) / (max - min)) * 100);

    const handleMouseDown = (index) => (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startVal = localValue[index];
        const sliderWidth = sliderRef.current.offsetWidth;

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaVal = (deltaX / sliderWidth) * (max - min);
            let newVal = Math.round(startVal + deltaVal);

            // Clamp values
            newVal = Math.max(min, Math.min(max, newVal));

            const newValue = [...localValue];
            newValue[index] = newVal;

            // Ensure min <= max
            if (index === 0) {
                newValue[0] = Math.min(newValue[0], newValue[1]);
            } else {
                newValue[1] = Math.max(newValue[1], newValue[0]);
            }

            setLocalValue(newValue);
            onChange(newValue);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleInputChange = (index, val) => {
        let numVal = parseInt(val, 10);
        if (isNaN(numVal)) return;

        const newValue = [...localValue];
        newValue[index] = numVal;

        // Don't enforce min/max strictly during typing, but do on blur or submit if needed.
        // For now, let's just update parent if valid-ish
        if (index === 0 && numVal > newValue[1]) numVal = newValue[1];
        if (index === 1 && numVal < newValue[0]) numVal = newValue[0];

        // Clamp to global min/max
        numVal = Math.max(min, Math.min(max, numVal));

        newValue[index] = numVal;
        setLocalValue(newValue);
        onChange(newValue);
    };

    // Styles based on variant
    const isNeon = variant === 'neon';

    const trackColor = isNeon
        ? (isDark ? 'bg-slate-800/50' : 'bg-slate-200/50')
        : (isDark ? 'bg-slate-700' : 'bg-slate-200');

    const rangeColor = isNeon
        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
        : (isDark ? 'bg-blue-500' : 'bg-blue-600');

    const thumbColor = isNeon
        ? 'bg-white/90 backdrop-blur-sm border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
        : (isDark ? 'bg-white border-blue-500' : 'bg-white border-blue-600');

    const inputBg = isNeon
        ? 'bg-transparent border-b border-slate-500/30 hover:border-cyan-400/50 focus:border-cyan-400'
        : (isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200');

    const inputClass = isNeon
        ? `w-16 px-1 py-1 text-sm text-center focus:outline-none transition-colors ${inputBg} ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-mono`
        : `w-16 px-2 py-1 text-sm rounded border text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${isDark ? 'text-slate-200' : 'text-slate-700'}`;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${isNeon ? 'text-cyan-500/80' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                    {label}
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Min Input */}
                <input
                    type="number"
                    value={localValue[0]}
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    className={inputClass}
                />

                {/* Slider */}
                <div className="relative flex-1 h-6 flex items-center group" ref={sliderRef}>
                    {/* Track Background */}
                    <div className={`absolute w-full h-1.5 rounded-full ${trackColor}`}></div>

                    {/* Active Range */}
                    <div
                        className={`absolute h-1.5 rounded-full transition-all duration-100 ${rangeColor}`}
                        style={{
                            left: `${getPercent(localValue[0])}%`,
                            width: `${getPercent(localValue[1]) - getPercent(localValue[0])}%`
                        }}
                    ></div>

                    {/* Thumb 1 */}
                    <div
                        className={`absolute w-4 h-4 rounded-full cursor-grab hover:scale-125 transition-transform z-10 ${thumbColor}`}
                        style={{ left: `calc(${getPercent(localValue[0])}% - 8px)` }}
                        onMouseDown={handleMouseDown(0)}
                    ></div>

                    {/* Thumb 2 */}
                    <div
                        className={`absolute w-4 h-4 rounded-full cursor-grab hover:scale-125 transition-transform z-10 ${thumbColor}`}
                        style={{ left: `calc(${getPercent(localValue[1])}% - 8px)` }}
                        onMouseDown={handleMouseDown(1)}
                    ></div>
                </div>

                {/* Max Input */}
                <input
                    type="number"
                    value={localValue[1]}
                    onChange={(e) => handleInputChange(1, e.target.value)}
                    className={inputClass}
                />
            </div>
        </div>
    );
}
