import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function MetricCard({ metric, isActive, onClick, theme }) {
    const { title, value, trend, icon: Icon, color } = metric;

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

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

    const darkColorStyles = {
        blue: 'bg-blue-900/30 text-blue-400 border-blue-800 group-hover:border-blue-700',
        emerald: 'bg-emerald-900/30 text-emerald-400 border-emerald-800 group-hover:border-emerald-700',
        red: 'bg-red-900/30 text-red-400 border-red-800 group-hover:border-red-700',
        green: 'bg-green-900/30 text-green-400 border-green-800 group-hover:border-green-700',
        indigo: 'bg-indigo-900/30 text-indigo-400 border-indigo-800 group-hover:border-indigo-700',
        purple: 'bg-purple-900/30 text-purple-400 border-purple-800 group-hover:border-purple-700',
        cyan: 'bg-cyan-900/30 text-cyan-400 border-cyan-800 group-hover:border-cyan-700',
        orange: 'bg-orange-900/30 text-orange-400 border-orange-800 group-hover:border-orange-700',
        amber: 'bg-amber-900/30 text-amber-400 border-amber-800 group-hover:border-amber-700',
        teal: 'bg-teal-900/30 text-teal-400 border-teal-800 group-hover:border-teal-700',
        pink: 'bg-pink-900/30 text-pink-400 border-pink-800 group-hover:border-pink-700',
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

    const activeDarkBorderStyles = {
        blue: 'border-blue-500 ring-blue-900/50',
        emerald: 'border-emerald-500 ring-emerald-900/50',
        red: 'border-red-500 ring-red-900/50',
        green: 'border-green-500 ring-green-900/50',
        indigo: 'border-indigo-500 ring-indigo-900/50',
        purple: 'border-purple-500 ring-purple-900/50',
        cyan: 'border-cyan-500 ring-cyan-900/50',
        orange: 'border-orange-500 ring-orange-900/50',
        amber: 'border-amber-500 ring-amber-900/50',
        teal: 'border-teal-500 ring-teal-900/50',
        pink: 'border-pink-500 ring-pink-900/50',
    };

    const getActiveStyle = () => {
        if (isActive) {
            if (isDark) return `ring-2 ${activeDarkBorderStyles[color] || 'border-blue-500 ring-blue-900/50'} shadow-lg scale-[1.02] ${isDarkest ? 'bg-neutral-950' : 'bg-slate-800'}`;
            return `ring-2 ${activeBorderStyles[color] || 'border-blue-500 ring-blue-100'} shadow-lg scale-[1.02] bg-white`;
        }
        if (isDarkest) return `hover:shadow-md hover:scale-[1.01] border-neutral-900 bg-neutral-950/60 hover:bg-neutral-950`;
        if (isDark) return `hover:shadow-md hover:scale-[1.01] border-slate-800 bg-slate-800/60 hover:bg-slate-800`;
        return `hover:shadow-md hover:scale-[1.01] border-slate-100 bg-white/60 hover:bg-white`;
    };

    const trendColor = trend > 0
        ? (isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-100/50')
        : trend < 0
            ? (isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100/50')
            : (isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100/50');

    const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;

    return (
        <button
            onClick={onClick}
            className={`
        relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 ease-out text-left min-w-[220px] w-[220px] h-[150px] snap-start group animate-in fade-in slide-in-from-bottom-4
        ${getActiveStyle()}
      `}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${isDark ? (darkColorStyles[color] || 'bg-slate-800 text-slate-400') : (colorStyles[color] || 'bg-slate-50 text-slate-600')}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trendColor}`}>
                    <TrendIcon size={14} />
                    <span>{Math.abs(trend)}%</span>
                </div>
            </div>

            <div className="mt-auto">
                <p className={`text-sm font-medium mb-1 truncate w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={title}>{title}</p>
                <h3 className={`text-2xl font-bold tracking-tight truncate w-full ${isDark ? 'text-white' : 'text-slate-900'}`} title={value}>{value}</h3>
            </div>
        </button>
    );
}
