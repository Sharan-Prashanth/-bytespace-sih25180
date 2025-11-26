'use client';

import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import GlassCard from '../Shared/GlassCard';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function BarChart({ data, labels, title, color = 'blue' }) {
    const colorMap = {
        blue: { start: 'rgba(59, 130, 246, 0.9)', end: 'rgba(96, 165, 250, 0.4)' },
        purple: { start: 'rgba(147, 51, 234, 0.9)', end: 'rgba(192, 132, 252, 0.4)' },
        green: { start: 'rgba(16, 185, 129, 0.9)', end: 'rgba(52, 211, 153, 0.4)' },
        emerald: { start: 'rgba(16, 185, 129, 0.9)', end: 'rgba(52, 211, 153, 0.4)' },
        orange: { start: 'rgba(249, 115, 22, 0.9)', end: 'rgba(253, 186, 116, 0.4)' },
        red: { start: 'rgba(239, 68, 68, 0.9)', end: 'rgba(252, 165, 165, 0.4)' },
        indigo: { start: 'rgba(99, 102, 241, 0.9)', end: 'rgba(165, 180, 252, 0.4)' },
        slate: { start: 'rgba(100, 116, 139, 0.9)', end: 'rgba(148, 163, 184, 0.4)' },
    };

    const activeColor = colorMap[color] || colorMap.blue;

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Value',
                data: data,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, activeColor.start);
                    gradient.addColorStop(1, activeColor.end);
                    return gradient;
                },
                borderRadius: 8,
                barThickness: 24,
                borderSkipped: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    labelTextColor: () => '#475569',
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(226, 232, 240, 0.6)', // slate-200
                    drawBorder: false,
                    borderDash: [4, 4],
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: '500'
                    },
                    color: '#94a3b8', // slate-400
                    padding: 10
                },
                border: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: '500'
                    },
                    color: '#64748b', // slate-500
                    padding: 10
                },
                border: {
                    display: false
                }
            },
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10
            }
        }
    };

    return (
        <GlassCard className="p-6 h-full flex flex-col">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>}
            <div className="flex-1 min-h-[250px]">
                <Bar data={chartData} options={options} />
            </div>
        </GlassCard>
    );
}
