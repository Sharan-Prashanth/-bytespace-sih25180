'use client';

import { Briefcase, CheckCircle, FileText, Layers, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import ChartGrid from '../Components/ChartGrid';
import ChartPopup from '../Components/ChartPopup';
import StatCard from '../Components/StatCard';
import RightSidebar from '../Sidebar/RightSidebar';

export default function OverviewSection({
    metrics,
    activeMetric,
    onMetricClick,
    allMetrics,
    selectedMetrics,
    toggleMetric,
    resetMetrics,
    theme,
    controlMetricKey,
    overrideValues,
    overrideMonths
}) {
    const [popupMetric, setPopupMetric] = useState(null);

    const handleChartClick = (metric) => {
        setPopupMetric(metric);
    };

    const handleClosePopup = () => {
        setPopupMetric(null);
    };

    // Filter data based on sliders
    const filteredMetrics = useMemo(() => {
        // console.log('Filtering Debug:', { controlMetricKey, overrideValues, overrideMonths });

        if (!controlMetricKey || !overrideValues || !overrideMonths) {
            return metrics;
        }

        return metrics.map(m => {
            if (m.key === controlMetricKey) {
                // Filter this metric's data
                const filteredData = m.data.filter((d, i) => {
                    const monthIdx = i + 1; // Assuming 1-based index for months
                    const val = d.value;

                    // Check time range (month index)
                    const inTimeRange = monthIdx >= overrideMonths[0] && monthIdx <= overrideMonths[1];

                    // Check value range
                    const inValueRange = val >= overrideValues[0] && val <= overrideValues[1];

                    return inTimeRange && inValueRange;
                });

                // console.log(`Filtered ${m.key}: ${m.data.length} -> ${filteredData.length} items`);
                return { ...m, data: filteredData };
            }
            return m;
        });
    }, [metrics, controlMetricKey, overrideValues, overrideMonths]);

    // Top Row Stats Data
    const topStats = [
        { title: 'Total Proposals', value: 2543, icon: FileText, color: 'blue' },
        { title: 'Rejected Proposals', value: 120, icon: XCircle, color: 'red' },
        { title: 'Accepted Proposals', value: 1850, icon: CheckCircle, color: 'green' },
        { title: 'Projects Ongoing', value: 320, icon: Layers, color: 'purple' },
        { title: 'Completed Projects', value: 145, icon: Briefcase, color: 'yellow' },
    ];

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Top Row - Vibrant Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
                {topStats.map((stat, index) => (
                    <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        theme={theme}
                    />
                ))}
            </div>

            {/* Bottom Section: Chart Grid + Sidebar */}
            <div className="flex flex-1 min-h-0 gap-6">
                {/* Chart Grid Area */}
                <div className="flex-1 min-w-0 h-full">
                    <ChartGrid
                        metrics={filteredMetrics}
                        onMetricClick={handleChartClick}
                        theme={theme}
                    />
                </div>

                {/* Right Sidebar - Metrics Selection */}
                <div className="w-80 shrink-0 h-full">
                    <RightSidebar
                        allMetrics={allMetrics}
                        selectedMetrics={selectedMetrics}
                        toggleMetric={toggleMetric}
                        resetMetrics={resetMetrics}
                        theme={theme}
                    />
                </div>
            </div>

            {/* Popup Modal */}
            <ChartPopup
                metric={popupMetric}
                isOpen={!!popupMetric}
                onClose={handleClosePopup}
                theme={theme}
            />
        </div>
    );
}
