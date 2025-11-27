'use client';

import {
    AlertCircle,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    CreditCard,
    DollarSign,
    PieChart,
    TrendingUp,
    Wallet
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import ProposalFinanceDetail from "../Finance/ProposalFinanceDetail";

// --- MOCK DATA ---

const FINANCE_METRICS = [
    { key: 'proposed', title: 'Proposed Funding', value: '₹12.5 Cr', change: '+15%', trend: 'up', icon: DollarSign, color: 'blue' },
    { key: 'allocated', title: 'Funds Allocated', value: '₹8.2 Cr', change: '+8%', trend: 'up', icon: Wallet, color: 'emerald' },
    { key: 'hold', title: 'Funds in Hold', value: '₹1.5 Cr', change: '-2%', trend: 'down', icon: AlertCircle, color: 'amber' },
    { key: 'remaining', title: 'Unallocated Funds', value: '₹2.8 Cr', change: 'N/A', trend: 'neutral', icon: CreditCard, color: 'purple' },
];

const FINANCE_PROPOSALS = [
    { id: "PROP001", title: "AI-Powered Coal Quality Assessment", submitter: "Dr. Rajesh Kumar", department: "IIT Delhi", category: "Technology", status: "Allocated", approvedBudget: "₹25,00,000", allocatedAmount: "₹10,00,000", remainingAmount: "₹15,00,000", lastUpdate: "Oct 01, 2025" },
    { id: "PROP005", title: "Carbon Capture Technology", submitter: "Dr. Vikram Singh", department: "IIT Kharagpur", category: "Environment", status: "Allocated", approvedBudget: "₹50,00,000", allocatedAmount: "₹20,00,000", remainingAmount: "₹30,00,000", lastUpdate: "Sep 28, 2025" },
    { id: "PROP008", title: "Safety Gear Modernization", submitter: "Mr. Suresh Patil", department: "CMPDI", category: "Safety", status: "In Hold", approvedBudget: "₹15,00,000", allocatedAmount: "₹0", remainingAmount: "₹15,00,000", lastUpdate: "Sep 25, 2025" },
    { id: "PROP012", title: "Groundwater Analysis", submitter: "Dr. Anjali Desai", department: "Regional Inst.", category: "Environment", status: "Allocated", approvedBudget: "₹18,00,000", allocatedAmount: "₹18,00,000", remainingAmount: "₹0", lastUpdate: "Sep 20, 2025" },
];

const ANNUAL_FUNDING_DATA = [
    { name: '2021', value: 8.5 },
    { name: '2022', value: 9.2 },
    { name: '2023', value: 10.8 },
    { name: '2024', value: 11.5 },
    { name: '2025', value: 12.5 },
];

const ALLOCATION_BREAKDOWN_DATA = [
    { name: 'Allocated', value: 65, color: '#10b981' },
    { name: 'In Hold', value: 12, color: '#f59e0b' },
    { name: 'Unallocated', value: 23, color: '#a855f7' },
];

const MONTHLY_ALLOCATION_DATA = [
    { name: 'Jan', value: 40 },
    { name: 'Feb', value: 30 },
    { name: 'Mar', value: 60 },
    { name: 'Apr', value: 45 },
    { name: 'May', value: 70 },
    { name: 'Jun', value: 55 },
    { name: 'Jul', value: 80 },
    { name: 'Aug', value: 65 },
    { name: 'Sep', value: 90 },
    { name: 'Oct', value: 75 },
    { name: 'Nov', value: 85 },
    { name: 'Dec', value: 100 },
];

// --- COMPONENTS ---

const MetricCard = ({ metric, theme }) => {
    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const colors = {
        blue: isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600',
        emerald: isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        amber: isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-600',
        purple: isDark ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-50 text-purple-600',
    };

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${cardBg}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[metric.color]}`}>
                    <metric.icon size={24} />
                </div>
                {metric.change !== 'N/A' && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full 
                        ${metric.trend === 'up'
                            ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                            : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')}
                    `}>
                        {metric.trend === 'up' ? <TrendingUp size={12} /> : <ArrowUpRight size={12} className="rotate-180" />}
                        {metric.change}
                    </div>
                )}
            </div>
            <h3 className={`text-3xl font-bold mb-1 ${textColor}`}>{metric.value}</h3>
            <p className={`text-sm font-medium ${subTextColor}`}>{metric.title}</p>
        </div>
    );
};

export default function FinanceSection({ theme }) {
    const [selectedProposal, setSelectedProposal] = useState(null);
    const router = useRouter();

    // Handle URL query param for finance ID
    useEffect(() => {
        if (router.query.financeId) {
            const proposal = FINANCE_PROPOSALS.find(p => p.id === router.query.financeId);
            if (proposal) setSelectedProposal(proposal);
        } else {
            setSelectedProposal(null);
        }
    }, [router.query.financeId]);

    const handleProposalClick = (proposal) => {
        setSelectedProposal(proposal);
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, financeId: proposal.id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedProposal(null);
        const { financeId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const gridColor = isDarkest ? '#171717' : isDark ? '#334155' : '#f1f5f9';
    const axisColor = isDark ? '#94a3b8' : '#64748b';

    if (selectedProposal) {
        return <ProposalFinanceDetail proposal={selectedProposal} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Financial Overview</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Manage and track research funding allocation.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer ${cardBg}`}>
                    <Calendar size={16} className={subTextColor} />
                    <span className={textColor}>FY 2025-26</span>
                    <ChevronDown size={16} className={subTextColor} />
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {FINANCE_METRICS.map((metric) => (
                    <MetricCard key={metric.key} metric={metric} theme={theme} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Bar Chart - Annual Funding */}
                <div className={`p-6 rounded-3xl shadow-sm border ${cardBg} xl:col-span-2`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Annual Funding Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ANNUAL_FUNDING_DATA} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                                    cursor={{ fill: isDark ? '#334155' : '#f1f5f9' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Allocation Breakdown */}
                <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Allocation Breakdown</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ALLOCATION_BREAKDOWN_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ALLOCATION_BREAKDOWN_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <div className="text-center">
                                <p className={`text-2xl font-bold ${textColor}`}>100%</p>
                                <p className={`text-xs ${subTextColor}`}>Total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Chart - Monthly Trends */}
                <div className={`p-6 rounded-3xl shadow-sm border ${cardBg} lg:col-span-2 xl:col-span-3`}>
                    <h3 className={`text-lg font-bold mb-6 ${textColor}`}>Monthly Allocation Trends</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MONTHLY_ALLOCATION_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Proposals Table */}
            <div className={`rounded-3xl shadow-sm border overflow-hidden ${cardBg}`}>
                <div className={`p-6 border-b ${borderColor}`}>
                    <h3 className={`text-lg font-bold ${textColor}`}>Approved Proposals & Funding</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b ${borderColor}`}>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal Title</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Submitter</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Approved Budget</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Allocated</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Remaining</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Last Update</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                            {FINANCE_PROPOSALS.map((proposal) => (
                                <tr
                                    key={proposal.id}
                                    onClick={() => handleProposalClick(proposal)}
                                    className={`group transition-colors cursor-pointer ${isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}
                                >
                                    <td className="p-6">
                                        <div className={`font-bold ${textColor} line-clamp-1`}>{proposal.title}</div>
                                        <div className={`text-xs ${subTextColor}`}>{proposal.id}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.submitter}</div>
                                        <div className={`text-xs ${subTextColor}`}>{proposal.department}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                                            ${proposal.status === 'Allocated'
                                                ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                                : (isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100')
                                            }
                                        `}>
                                            {proposal.status}
                                        </span>
                                    </td>
                                    <td className={`p-6 text-sm font-bold ${textColor}`}>{proposal.approvedBudget}</td>
                                    <td className={`p-6 text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{proposal.allocatedAmount}</td>
                                    <td className={`p-6 text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{proposal.remainingAmount}</td>
                                    <td className={`p-6 text-right text-sm font-medium ${subTextColor}`}>{proposal.lastUpdate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
