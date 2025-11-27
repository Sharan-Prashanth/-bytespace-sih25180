import { ArrowLeft, Building, Calendar, CheckCircle, DollarSign, Download, FileText, MessageSquare, Paperclip } from 'lucide-react';

export default function ProposalDetail({ proposal, onBack, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-950 border-neutral-900' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-900' : isDark ? 'border-slate-700' : 'border-slate-100';

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
            case 'Rejected': return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
            default: return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
        }
    };

    // Mock Workflow Timeline
    const timeline = [
        { status: 'Submitted', date: proposal.dateSubmitted, completed: true },
        { status: 'Under Review', date: 'Oct 25, 2024', completed: true },
        { status: 'Final Decision', date: 'Pending', completed: false },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className={`text-xl font-bold ${textColor}`}>{proposal.id}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                {proposal.status}
                            </span>
                        </div>
                        <p className={`text-sm ${subTextColor} mt-1`}>Research Proposal Details</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Summary */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h1 className={`text-2xl font-bold mb-4 ${textColor}`}>{proposal.title}</h1>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                                <Building size={14} /> {proposal.department}
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                                <FileText size={14} /> {proposal.category}
                            </div>
                        </div>

                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${subTextColor}`}>Executive Summary</h3>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {proposal.summary}
                        </p>
                    </div>

                    {/* Attachments */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Attachments</h3>
                        <div className="space-y-3">
                            {['Project_Proposal_v1.pdf', 'Budget_Breakdown.xlsx', 'Research_Methodology.docx'].map((file, i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
                                            <Paperclip size={18} />
                                        </div>
                                        <span className={`text-sm font-medium ${textColor}`}>{file}</span>
                                    </div>
                                    <button className={`p-2 rounded-lg hover:bg-opacity-80 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
                                        <Download size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                            <h3 className={`text-lg font-bold ${textColor}`}>Admin Notes</h3>
                        </div>
                        <textarea
                            placeholder="Add internal notes about this proposal..."
                            className={`w-full h-32 p-4 rounded-xl text-sm font-medium border outline-none focus:ring-2 focus:ring-blue-500/20 resize-none
                                ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}
                            `}
                        />
                        <div className="flex justify-end mt-3">
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Key Details */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Key Details</h3>

                        <div className="space-y-6">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Principal Investigator</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                        {proposal.submitterName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${textColor}`}>{proposal.submitterName}</p>
                                        <p className={`text-xs ${subTextColor}`}>Project Lead</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Budget Requested</p>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={18} className="text-emerald-500" />
                                    <p className={`text-xl font-bold ${textColor}`}>{proposal.budget}</p>
                                </div>
                            </div>

                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Submission Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-blue-500" />
                                    <p className={`text-sm font-medium ${textColor}`}>{proposal.dateSubmitted}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Timeline */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Workflow Status</h3>
                        <div className="space-y-6">
                            {timeline.map((step, index) => (
                                <div key={index} className="relative pl-8 last:pb-0">
                                    {/* Line */}
                                    {index !== timeline.length - 1 && (
                                        <div className={`absolute left-[11px] top-2 bottom-0 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                    )}

                                    {/* Dot */}
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center 
                                        ${step.completed
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : isDark ? 'bg-slate-900 border-slate-700 text-slate-600' : 'bg-white border-slate-200 text-slate-300'}
                                    `}>
                                        {step.completed && <CheckCircle size={12} fill="currentColor" />}
                                    </div>

                                    <div>
                                        <p className={`text-sm font-bold ${step.completed ? textColor : subTextColor}`}>{step.status}</p>
                                        <p className={`text-xs ${subTextColor}`}>{step.date}</p>
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
