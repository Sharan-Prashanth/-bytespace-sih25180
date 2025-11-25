import { useEffect, useState } from 'react';
import { getMetricDetails, getMetrics } from '../../../utils/mockDashboardData';
import DetailPanel from '../Overview/DetailPanel';
import MetricsScroller from '../Overview/MetricsScroller';

export default function OverviewSection() {
    const [metrics, setMetrics] = useState([]);
    const [activeMetric, setActiveMetric] = useState(null);
    const [metricDetails, setMetricDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { metrics: data } = await getMetrics();
                setMetrics(data);
                if (data.length > 0) {
                    setActiveMetric(data[0]);
                    // Fetch details for the first metric
                    const details = await getMetricDetails(data[0].key);
                    setMetricDetails(details);
                }
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleMetricClick = async (metric) => {
        if (activeMetric?.key === metric.key) return;

        setActiveMetric(metric);
        setDetailsLoading(true);
        try {
            const details = await getMetricDetails(metric.key);
            setMetricDetails(details);
        } catch (error) {
            console.error('Failed to fetch metric details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">

            {/* Metrics Scroller */}
            <MetricsScroller
                metrics={metrics}
                activeMetric={activeMetric}
                onMetricClick={handleMetricClick}
            />

            {/* Detail Panel */}
            <div className={`transition-opacity duration-300 ${detailsLoading ? 'opacity-50' : 'opacity-100'}`}>
                <DetailPanel
                    activeMetric={activeMetric}
                    metricDetails={metricDetails}
                />
            </div>
        </div>
    );
}
