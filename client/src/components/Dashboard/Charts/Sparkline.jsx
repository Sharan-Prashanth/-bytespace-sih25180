'use client';

import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler
);

export default function Sparkline({ data = [], color = 'orange' }) {
    const getColor = (c) => {
        const colors = {
            orange: 'rgb(249, 115, 22)',
            blue: 'rgb(59, 130, 246)',
            purple: 'rgb(147, 51, 234)',
            green: 'rgb(34, 197, 94)',
            red: 'rgb(239, 68, 68)',
        };
        return colors[c] || colors.orange;
    };

    const chartData = {
        labels: data.map((_, i) => i),
        datasets: [
            {
                data: data.length > 0 ? data : [10, 15, 12, 20, 18, 25, 22],
                borderColor: getColor(color),
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
                    gradient.addColorStop(0, getColor(color).replace('rgb', 'rgba').replace(')', ', 0.2)'));
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    return gradient;
                },
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 },
        },
        interaction: {
            intersect: false,
        },
    };

    return <Line data={chartData} options={options} />;
}
