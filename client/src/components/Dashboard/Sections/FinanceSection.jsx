'use client';

import {
    ArrowDownRight,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Download,
    Wallet
} from "lucide-react";

export default function FinanceSection() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Finance Overview</h2>
                    <p className="text-slate-500 text-sm mt-1">Track revenue, expenses, and budget allocation.</p>
                </div>
                <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all">
                    <Download size={20} />
                </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Wallet size={24} />
                        </div>
                        <p className="text-slate-400 font-medium mb-1">Total Balance</p>
                        <h3 className="text-3xl font-bold mb-4">$124,500.00</h3>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                            <ArrowUpRight size={16} />
                            <span>+12.5% from last month</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                        <DollarSign size={24} />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">$45,200.00</h3>
                    <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                        <ArrowUpRight size={16} />
                        <span>+8.2%</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                        <CreditCard size={24} />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">Total Expenses</p>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">$12,800.00</h3>
                    <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                        <ArrowDownRight size={16} />
                        <span>-2.4%</span>
                    </div>
                </div>
            </div>

            {/* Recent Transactions (Placeholder) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Transactions</h3>
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Project Payment</p>
                                    <p className="text-xs text-slate-500">Today, 10:45 AM</p>
                                </div>
                            </div>
                            <span className="font-bold text-emerald-600">+$1,200.00</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
