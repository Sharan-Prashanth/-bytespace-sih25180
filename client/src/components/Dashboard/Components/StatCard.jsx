'use client';

import { useEffect, useState } from 'react';

export default function StatCard({
    title,
    value,
    icon: Icon,
    color,
    theme
}) {
    const [displayValue, setDisplayValue] = useState(0);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    useEffect(() => {
        let start = 0;
        const end = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
        if (end === 0) {
            setDisplayValue(0);
            return;
        }

        const duration = 1000; // 1 second
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(ease * end);
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(end);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    // Subtle Color Styles
    const styles = {
        blue: {
            light: 'bg-blue-50 border-blue-100 text-blue-900',
            dark: 'bg-blue-900/20 border-blue-800 text-blue-100',
            darkest: 'bg-neutral-900 border-blue-900/40 text-blue-400'
        },
        green: {
            light: 'bg-emerald-50 border-emerald-100 text-emerald-900',
            dark: 'bg-emerald-900/20 border-emerald-800 text-emerald-100',
            darkest: 'bg-neutral-900 border-emerald-900/40 text-emerald-400'
        },
        red: {
            light: 'bg-red-50 border-red-100 text-red-900',
            dark: 'bg-red-900/20 border-red-800 text-red-100',
            darkest: 'bg-neutral-900 border-red-900/40 text-red-400'
        },
        purple: {
            light: 'bg-purple-50 border-purple-100 text-purple-900',
            dark: 'bg-purple-900/20 border-purple-800 text-purple-100',
            darkest: 'bg-neutral-900 border-purple-900/40 text-purple-400'
        },
        yellow: {
            light: 'bg-amber-50 border-amber-100 text-amber-900',
            dark: 'bg-amber-900/20 border-amber-800 text-amber-100',
            darkest: 'bg-neutral-900 border-amber-900/40 text-amber-400'
        }
    };

    const getStyle = () => {
        const colorSet = styles[color] || styles.blue;
        if (isDarkest) return `${colorSet.darkest} border shadow-none`;
        if (isDark) return `${colorSet.dark} border shadow-sm`;
        return `${colorSet.light} border shadow-sm`;
    };

    const getIconColor = () => {
        const colors = {
            blue: isDark ? 'text-blue-400' : 'text-blue-600',
            green: isDark ? 'text-emerald-400' : 'text-emerald-600',
            red: isDark ? 'text-red-400' : 'text-red-600',
            purple: isDark ? 'text-purple-400' : 'text-purple-600',
            yellow: isDark ? 'text-amber-400' : 'text-amber-600'
        };
        return colors[color] || colors.blue;
    };

    const getIconBg = () => {
        if (isDarkest) return 'bg-neutral-800';
        if (isDark) return 'bg-slate-800';
        return 'bg-white';
    };

    return (
        <div className={`relative overflow-hidden rounded-xl p-4 transition-transform hover:scale-[1.02] ${getStyle()}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 opacity-70`}>
                        {title}
                    </p>
                    <h3 className="text-2xl font-bold">
                        {typeof value === 'string' && value.includes('$') ? '$' : ''}
                        {displayValue.toLocaleString()}
                        {typeof value === 'string' && value.includes('%') ? '%' : ''}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${getIconBg()}`}>
                    <Icon size={18} className={getIconColor()} />
                </div>
            </div>
        </div>
    );
}
