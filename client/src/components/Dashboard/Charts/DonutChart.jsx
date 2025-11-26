'use client';

import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import GlassCard from '../Shared/GlassCard';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data, labels, title, colors = [] }) {
    const defaultColors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(147, 51, 234, 0.8)',  // Purple
        'rgba(16, 185, 129, 0.8)',  // Emerald
        'rgba(244, 63, 94, 0.8)',   // Rose
        'rgba(245, 158, 11, 0.8)',  // Amber
    ];

    const chartData = {
        labels: labels,
        datasets: [
            {
                data: data,
                backgroundColor: colors.length > 0 ? colors : defaultColors,
                borderColor: '#ffffff',
                borderWidth: 0,
                hoverOffset: 10,
                borderRadius: 4,
                spacing: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12,
                        weight: '500'
                    },
                    color: '#64748b' // slate-500
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    labelTextColor: () => '#475569',
                }
            }
        },
        cutout: '75%',
    };

    return (
        <GlassCard className="p-6 h-full flex flex-col">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>}
            <div className="flex-1 relative min-h-[250px]">
                <Doughnut data={chartData} options={options} />
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[100px]">
                    <div className="text-center">
                        <span className="block text-3xl font-black text-slate-800">{data.reduce((a, b) => a + b, 0)}</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
