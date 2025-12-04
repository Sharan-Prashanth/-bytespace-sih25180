'use client';


export default function CardRow({
    title,
    subtitle,
    status,
    statusColor = 'slate',
    meta = [],
    actions = [],
    image,
    icon: Icon
}) {
    const getStatusStyles = (color) => {
        const styles = {
            green: 'bg-green-100 text-green-700 border-green-200',
            red: 'bg-red-100 text-red-700 border-red-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            purple: 'bg-purple-100 text-purple-700 border-purple-200',
            slate: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return styles[color] || styles.slate;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusStyles(statusColor).replace('bg-', 'bg-').split(' ')[0]}`}></div>

            <div className="flex justify-between items-start mb-4 pl-2">
                <div className="flex items-center gap-3">
                    {Icon ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                            <Icon size={20} />
                        </div>
                    ) : image ? (
                        <img src={image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : null}
                    <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{title}</h3>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(statusColor)}`}>
                    {status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 pl-2">
                {meta.map((item, i) => (
                    <div key={i} className="text-sm">
                        <span className="text-slate-400 text-xs block mb-0.5">{item.label}</span>
                        <span className="font-medium text-slate-700">{item.value}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 pl-2">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className={`p-2 rounded-lg transition-colors ${action.className || 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'}`}
                        title={action.title}
                    >
                        {action.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}
