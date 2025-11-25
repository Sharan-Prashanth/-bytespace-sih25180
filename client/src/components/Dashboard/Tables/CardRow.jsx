'use client';


export default function CardRow({
    title,
    subtitle,
    status,
    statusColor = 'gray',
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
            gray: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return styles[color] || styles.gray;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusStyles(statusColor).replace('bg-', 'bg-').split(' ')[0]}`}></div>

            <div className="flex justify-between items-start mb-4 pl-2">
                <div className="flex items-center gap-3">
                    {Icon ? (
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                            <Icon size={20} />
                        </div>
                    ) : image ? (
                        <img src={image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : null}
                    <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1">{title}</h3>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(statusColor)}`}>
                    {status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 pl-2">
                {meta.map((item, i) => (
                    <div key={i} className="text-sm">
                        <span className="text-gray-400 text-xs block mb-0.5">{item.label}</span>
                        <span className="font-medium text-gray-700">{item.value}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-50 pl-2">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className={`p-2 rounded-lg transition-colors ${action.className || 'hover:bg-gray-50 text-gray-500 hover:text-gray-700'}`}
                        title={action.title}
                    >
                        {action.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}
