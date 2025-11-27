import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function MetricCard({ metric, isActive, onClick }) {
    const { title, value, trend, icon: Icon, color } = metric;

    // Color mapping for different metric types
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:border-blue-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:border-emerald-200',
        red: 'bg-red-50 text-red-600 border-red-100 group-hover:border-red-200',
        green: 'bg-green-50 text-green-600 border-green-100 group-hover:border-green-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:border-indigo-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:border-purple-200',
        cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100 group-hover:border-cyan-200',
        orange: 'bg-orange-50 text-orange-600 border-orange-100 group-hover:border-orange-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:border-amber-200',
        teal: 'bg-teal-50 text-teal-600 border-teal-100 group-hover:border-teal-200',
        pink: 'bg-pink-50 text-pink-600 border-pink-100 group-hover:border-pink-200',
    };

    const activeBorderStyles = {
        blue: 'border-blue-500 ring-blue-100',
        emerald: 'border-emerald-500 ring-emerald-100',
        red: 'border-red-500 ring-red-100',
        green: 'border-green-500 ring-green-100',
        indigo: 'border-indigo-500 ring-indigo-100',
        purple: 'border-purple-500 ring-purple-100',
        cyan: 'border-cyan-500 ring-cyan-100',
        orange: 'border-orange-500 ring-orange-100',
        amber: 'border-amber-500 ring-amber-100',
        teal: 'border-teal-500 ring-teal-100',
        pink: 'border-pink-500 ring-pink-100',
    };

    const activeStyle = isActive
        ? `ring-4 ${activeBorderStyles[color] || 'border-blue-500 ring-blue-100'} shadow-lg scale-[1.02]`
        : 'hover:shadow-md hover:scale-[1.01] border-slate-100';

    const trendColor = trend > 0 ? 'text-emerald-600 bg-emerald-50' : trend < 0 ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-50';
    const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

    return (
        <button
            onClick={onClick}
            className={`
        relative flex flex-col items-start p-5 rounded-2xl bg-white border transition-all duration-300 ease-out text-left min-w-[220px] w-[220px] h-[150px] snap-start group animate-in fade-in slide-in-from-bottom-4
        ${activeStyle}
      `}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${colorStyles[color] || 'bg-slate-50 text-slate-600'}`}>
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
