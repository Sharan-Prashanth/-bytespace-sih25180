import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { useRef, useState } from 'react';
import MetricCard from './MetricCard';

export default function MetricsScroller({ metrics, activeMetric, onMetricClick }) {
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 260; // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative group">
            {/* Left Scroll Button */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-slate-900 hover:scale-110 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Right Scroll Button */}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-slate-900 hover:scale-110 transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Metrics Scroller */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex items-center gap-5 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x snap-mandatory min-h-[180px]"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {metrics.map((metric) => (
                    <MetricCard
                        key={metric.key}
                        metric={metric}
                        isActive={activeMetric?.key === metric.key}
                        onClick={() => onMetricClick(metric)}
                    />
                ))}

                {/* Show More Button */}
                <button className="flex flex-col items-center justify-center min-w-[100px] h-[180px] rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all snap-start">
                    <div className="p-3 bg-slate-50 rounded-full mb-2">
                        <Grid size={20} />
                    </div>
                    <span className="text-xs font-bold">View All</span>
                </button>
            </div>
        </div>
    );
}
