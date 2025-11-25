import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function MetricCard({ metric, isActive, onClick }) {
    const { title, value, trend, icon: Icon, color } = metric;

    // Color mapping for different metric types
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        green: 'bg-green-50 text-green-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        orange: 'bg-orange-50 text-orange-600',
        amber: 'bg-amber-50 text-amber-600',
        teal: 'bg-teal-50 text-teal-600',
        pink: 'bg-pink-50 text-pink-600',
    };

    const activeStyle = isActive
        ? 'ring-2 ring-slate-900 shadow-lg scale-[1.02]'
        : 'hover:shadow-md hover:scale-[1.01] border-slate-100';

    const trendColor = trend > 0 ? 'text-emerald-600 bg-emerald-50' : trend < 0 ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-50';
    const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

    return (
        <button
            onClick={onClick}
            className={`
        relative flex flex-col items-start p-5 rounded-2xl bg-white border transition-all duration-200 text-left min-w-[240px] w-[240px] h-[140px] snap-start
        ${activeStyle}
      `}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl ${colorStyles[color] || 'bg-slate-50 text-slate-600'}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trendColor}`}>
                    <TrendIcon size={14} />
                    <span>{Math.abs(trend)}%</span>
                </div>
            </div>

            <div className="mt-auto">
                <p className="text-sm font-medium text-slate-500 mb-1 truncate w-full" title={title}>{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate w-full" title={value}>{value}</h3>
            </div>
        </button>
    );
}
