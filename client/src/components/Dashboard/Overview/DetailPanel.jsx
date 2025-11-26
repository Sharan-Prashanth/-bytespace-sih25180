import { Calendar, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                <p className="text-sm font-bold mb-1">{label}</p>
                <p className="text-lg font-bold text-blue-400">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function DetailPanel({ activeMetric, metricDetails }) {
    const [timeRange, setTimeRange] = useState('year');

    if (!activeMetric || !metricDetails) return null;

    const { chart, kpis } = metricDetails;

    const renderChart = () => {
        const commonProps = {
            data: chart.data,
            margin: { top: 10, right: 10, left: 0, bottom: 0 }
        };

        switch (chart.type) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            {/* Main Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{activeMetric.title} Analytics</h2>
                        <p className="text-sm text-slate-500">Track performance over time</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                        {['month', 'quarter', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`
                  px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize
                  ${timeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                `}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Column - Stats & Progress */}
            <div className="flex flex-col gap-6">
                {/* Progress Card */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-blue-300">
                            <TrendingUp size={20} />
                            <span className="text-sm font-bold uppercase tracking-wider">Progress</span>
                        </div>

                        <h3 className="text-3xl font-bold mb-2">Yearly Goal</h3>
                        <p className="text-slate-400 text-sm mb-6">You're on track to exceed your annual targets.</p>

                        <div className="mb-2 flex justify-between text-sm font-bold">
                            <span>{Math.round((kpis.this_year / (kpis.this_year * 1.2)) * 100)}%</span>
                            <span className="text-slate-400">Target: {(kpis.this_year * 1.2).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                style={{ width: `${(kpis.this_year / (kpis.this_year * 1.2)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 gap-4 flex-1">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">This Year</p>
                            <p className="text-lg font-bold text-slate-900">{kpis.this_year.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Growth</p>
                            <p className="text-lg font-bold text-slate-900">+{kpis.vs_last_year_pct}%</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Institutes</p>
                            <p className="text-lg font-bold text-slate-900">{kpis.institutes_participating}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
