import { ArrowLeft, Building, CheckCircle, Clock, FileText, Mail, Shield } from 'lucide-react';

export default function UserDetail({ user, onBack, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    // Mock Activity Data
    const activities = [
        { id: 1, type: 'submission', title: 'Submitted Proposal #2024-001', date: '2 days ago', icon: FileText, color: 'blue' },
        { id: 2, type: 'approval', title: 'Approved for Funding', date: '1 week ago', icon: CheckCircle, color: 'emerald' },
        { id: 3, type: 'login', title: 'Logged in from New Device', date: '2 weeks ago', icon: Shield, color: 'slate' },
    ];

    // Mock Proposals Data
    const proposals = [
        { id: 101, title: 'AI in Coal Mining Safety', status: 'Under Review', date: 'Oct 15, 2024', amount: '₹25,00,000' },
        { id: 102, title: 'Sustainable Extraction Methods', status: 'Approved', date: 'Sep 01, 2024', amount: '₹40,00,000' },
        { id: 103, title: 'Groundwater Impact Analysis', status: 'Rejected', date: 'Aug 10, 2024', amount: '₹15,00,000' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
            case 'Rejected': return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
            default: return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
        }
    };

    const cardBg = isDarkest ? 'bg-neutral-950 border-neutral-900' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-900' : isDark ? 'border-slate-700' : 'border-slate-100';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>{user.name}</h2>
                    <p className={`text-sm ${subTextColor}`}>User Profile & Activity</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: User Info */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                {user.name.charAt(0)}
                            </div>
                            <h3 className={`text-xl font-bold ${textColor}`}>{user.name}</h3>
                            <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                {user.status}
                            </span>
                        </div>

                        <div className={`space-y-4 pt-6 border-t ${borderColor}`}>
                            <div className="flex items-center gap-3">
                                <Mail size={18} className={subTextColor} />
                                <div>
                                    <p className={`text-xs font-medium ${subTextColor}`}>Email</p>
                                    <p className={`text-sm font-medium ${textColor}`}>{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield size={18} className={subTextColor} />
                                <div>
                                    <p className={`text-xs font-medium ${subTextColor}`}>Role</p>
                                    <p className={`text-sm font-medium ${textColor}`}>{user.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building size={18} className={subTextColor} />
                                <div>
                                    <p className={`text-xs font-medium ${subTextColor}`}>Organization</p>
                                    <p className={`text-sm font-medium ${textColor}`}>{user.org}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Activity */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h4 className={`text-lg font-bold mb-4 ${textColor}`}>Recent Activity</h4>
                        <div className="space-y-6">
                            {activities.map((activity, index) => (
                                <div key={activity.id} className="relative pl-6 pb-2 last:pb-0">
                                    {/* Line */}
                                    {index !== activities.length - 1 && (
                                        <div className={`absolute left-[9px] top-2 bottom-0 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                    )}
                                    {/* Dot */}
                                    <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`} />
                                    </div>

                                    <div>
                                        <p className={`text-sm font-medium ${textColor}`}>{activity.title}</p>
                                        <p className={`text-xs ${subTextColor}`}>{activity.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Proposals & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Proposals', value: '12', icon: FileText, color: 'blue' },
                            { label: 'Approved', value: '8', icon: CheckCircle, color: 'emerald' },
                            { label: 'Pending', value: '4', icon: Clock, color: 'amber' },
                        ].map((stat, i) => (
                            <div key={i} className={`p-5 rounded-2xl border ${cardBg}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                        <stat.icon size={20} />
                                    </div>
                                </div>
                                <p className={`text-2xl font-bold ${textColor}`}>{stat.value}</p>
                                <p className={`text-sm ${subTextColor}`}>{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Past Proposals */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className={`text-lg font-bold ${textColor}`}>Proposal History</h4>
                            <button className={`text-sm font-medium hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
                        </div>

                        <div className="space-y-4">
                            {proposals.map((proposal) => (
                                <div key={proposal.id} className={`p-4 rounded-xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h5 className={`font-bold ${textColor}`}>{proposal.title}</h5>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs ${subTextColor}`}>{proposal.date}</span>
                                                    <span className={`text-xs ${subTextColor}`}>•</span>
                                                    <span className={`text-xs font-medium ${textColor}`}>{proposal.amount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
