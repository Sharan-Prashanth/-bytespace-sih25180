'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Sparkline from '../Charts/Sparkline';
import GlassCard from '../Shared/GlassCard';
import AnimatedCounter from './AnimatedCounter';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = "blue", data = [] }) {
    const getColorClasses = (color) => {
        const colors = {
            orange: { bg: 'bg-orange-500', text: 'text-orange-600', gradient: 'from-orange-500 to-red-500' },
            blue: { bg: 'bg-blue-500', text: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
            purple: { bg: 'bg-purple-500', text: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
            green: { bg: 'bg-emerald-500', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
            red: { bg: 'bg-rose-500', text: 'text-rose-600', gradient: 'from-rose-500 to-red-600' },
        };
        return colors[color] || colors.blue;
    };

    const theme = getColorClasses(color);

    return (
        <GlassCard className="p-6 group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-6">
                <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${color}-500/30
          bg-gradient-to-br ${theme.gradient} group-hover:scale-110 transition-transform duration-300
        `}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            trend === 'down' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                        {trend === 'up' && <TrendingUp size={14} />}
                        {trend === 'down' && <TrendingDown size={14} />}
                        {trend === 'neutral' && <Minus size={14} />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-slate-500 text-sm font-semibold mb-1 tracking-wide uppercase opacity-80">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                        <AnimatedCounter targetValue={value} />
                    </h3>
                </div>
                <div className="w-28 h-14 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={data} color={color} />
                </div>
            </div>
        </GlassCard>
    );
}
