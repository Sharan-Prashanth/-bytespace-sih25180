import { AlertCircle, ArrowLeft, Building, CheckCircle, DollarSign, FileText, Wallet } from 'lucide-react';

export default function ProposalFinanceDetail({ proposal, onBack, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-950 border-neutral-900' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-900' : isDark ? 'border-slate-700' : 'border-slate-100';

    // Mock Financial Timeline
    const timeline = [
        { status: 'Budget Requested', date: 'Sep 01, 2025', amount: proposal.approvedBudget, completed: true },
        { status: 'Budget Approved', date: 'Sep 15, 2025', amount: proposal.approvedBudget, completed: true },
        { status: 'Initial Allocation (40%)', date: 'Oct 01, 2025', amount: proposal.allocatedAmount, completed: true },
        { status: 'Phase 2 Allocation', date: 'Pending', amount: '₹0', completed: false },
    ];

    // Mock Transaction History
    const transactions = [
        { id: 'TXN001', date: 'Oct 01, 2025', type: 'Credit', description: 'Initial Fund Release', amount: proposal.allocatedAmount, status: 'Success' },
        { id: 'TXN002', date: 'Oct 05, 2025', type: 'Debit', description: 'Equipment Procurement', amount: '₹5,00,000', status: 'Pending' },
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
                            <h2 className={`text-xl font-bold ${textColor}`}>{proposal.title}</h2>
                        </div>
                        <p className={`text-sm ${subTextColor} mt-1`}>Financial Overview & History</p>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    Status: {proposal.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Financial Stats */}
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Financial Summary</h3>

                        <div className="space-y-6">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Total Approved Budget</p>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={24} className="text-blue-500" />
                                    <p className={`text-2xl font-bold ${textColor}`}>{proposal.approvedBudget}</p>
                                </div>
                            </div>

                            <div className={`h-px w-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />

                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Funds Allocated</p>
                                <div className="flex items-center gap-2">
                                    <Wallet size={20} className="text-emerald-500" />
                                    <p className={`text-xl font-bold ${textColor}`}>{proposal.allocatedAmount}</p>
                                </div>
                            </div>

                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${subTextColor}`}>Remaining Balance</p>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={20} className="text-amber-500" />
                                    <p className={`text-xl font-bold ${textColor}`}>{proposal.remainingAmount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submitter Info */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Project Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {proposal.submitter.charAt(0)}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${textColor}`}>{proposal.submitter}</p>
                                    <p className={`text-xs ${subTextColor}`}>Principal Investigator</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building size={16} className={subTextColor} />
                                <p className={`text-sm font-medium ${textColor}`}>{proposal.department}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText size={16} className={subTextColor} />
                                <p className={`text-sm font-medium ${textColor}`}>{proposal.category}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline & Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Funding Timeline */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Funding Timeline</h3>
                        <div className="flex items-center justify-between relative">
                            {/* Connecting Line */}
                            <div className={`absolute left-0 right-0 top-3 h-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} -z-10`} />

                            {timeline.map((step, index) => (
                                <div key={index} className="flex flex-col items-center text-center bg-transparent">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2
                                        ${step.completed
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : isDark ? 'bg-slate-900 border-slate-700 text-slate-600' : 'bg-white border-slate-200 text-slate-300'}
                                    `}>
                                        {step.completed && <CheckCircle size={12} fill="currentColor" />}
                                    </div>
                                    <p className={`text-xs font-bold ${step.completed ? textColor : subTextColor}`}>{step.status}</p>
                                    <p className={`text-[10px] ${subTextColor}`}>{step.date}</p>
                                    <p className={`text-[10px] font-medium ${textColor} mt-1`}>{step.amount}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Transaction History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${borderColor}`}>
                                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Date</th>
                                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Description</th>
                                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Type</th>
                                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Amount</th>
                                        <th className={`p-4 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}>
                                            <td className={`p-4 text-sm font-medium ${textColor}`}>{txn.date}</td>
                                            <td className={`p-4 text-sm font-medium ${textColor}`}>{txn.description}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${txn.type === 'Credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {txn.type}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-sm font-bold ${textColor}`}>{txn.amount}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-medium ${txn.status === 'Success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Finance Notes */}
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                        <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Finance Team Notes</h3>
                        <textarea
                            placeholder="Add notes regarding fund allocation or budget adjustments..."
                            className={`w-full h-24 p-4 rounded-xl text-sm font-medium border outline-none focus:ring-2 focus:ring-blue-500/20 resize-none
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
            </div>
        </div>
    );
}
