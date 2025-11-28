'use client';

import ChartCard from './ChartCard';

export default function ChartGrid({
    metrics,
    onMetricClick,
    theme
}) {
    // We expect up to 4 metrics.
    // Layout:
    // Mobile: 1 column
    // Desktop: 2 columns (2x2 grid)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
            {metrics.map((metric, index) => (
                <ChartCard
                    key={metric.key}
                    metric={metric}
                    onClick={() => onMetricClick(metric)}
                    theme={theme}
                    forcedChartType={['bar', 'area', 'composed', 'radar'][index % 4]}
                />
            ))}

            {/* Placeholders if fewer than 4 selected */}
            {Array.from({ length: Math.max(0, 4 - metrics.length) }).map((_, i) => (
                <div
                    key={`placeholder-${i}`}
                    className={`rounded-2xl border border-dashed flex items-center justify-center
                        ${theme === 'darkest' ? 'border-neutral-800 bg-neutral-900/20' :
                            theme === 'dark' ? 'border-slate-700 bg-slate-800/20' :
                                'border-slate-200 bg-slate-50/50'}
                    `}
                >
                    <span className={`text-sm font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-slate-600' : 'text-slate-400'}`}>
                        Select a metric
                    </span>
                </div>
            ))}
        </div>
    );
}
