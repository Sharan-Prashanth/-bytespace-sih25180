'use client';

import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    PieChart as PieChartIcon,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Wallet,
    Receipt,
    FileText,
    Download,
    Filter,
    Calendar,
    LineChart as LineChartIcon,
    Activity
} from "lucide-react";
import { useState } from "react";

export default function FinanceSection({ theme }) {
    const [selectedPeriod, setSelectedPeriod] = useState('FY 2024-25');
    const [selectedQuarter, setSelectedQuarter] = useState('Q3');

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-gray-600';
    const iconBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
    const iconColor = isDark ? 'text-gray-400' : 'text-gray-700';

    // Mock Financial Data for Coal Sector
    const financialMetrics = [
        {
            label: 'Total Revenue',
            value: '₹4,856 Cr',
            change: '+18.5%',
            trend: 'up',
            Icon: DollarSign,
            color: 'emerald',
            subtitle: 'vs previous quarter'
        },
        {
            label: 'Operating Costs',
            value: '₹2,943 Cr',
            change: '+8.2%',
            trend: 'up',
            Icon: CreditCard,
            color: 'orange',
            subtitle: 'Operational expenses'
        },
        {
            label: 'Net Profit',
            value: '₹1,913 Cr',
            change: '+24.3%',
            trend: 'up',
            Icon: TrendingUp,
            color: 'blue',
            subtitle: 'Quarterly profit'
        },
        {
            label: 'Budget Utilization',
            value: '78.4%',
            change: '+5.1%',
            trend: 'up',
            Icon: PieChartIcon,
            color: 'purple',
            subtitle: 'of allocated budget'
        }
    ];

    // Quarterly Revenue vs Cost Data
    const quarterlyData = [
        { quarter: 'Q1 FY24', revenue: 4200, costs: 2650, profit: 1550, coalProduction: 145 },
        { quarter: 'Q2 FY24', revenue: 4450, costs: 2800, profit: 1650, coalProduction: 152 },
        { quarter: 'Q3 FY24', revenue: 4650, costs: 2900, profit: 1750, coalProduction: 158 },
        { quarter: 'Q4 FY24', revenue: 4350, costs: 2750, profit: 1600, coalProduction: 148 },
        { quarter: 'Q1 FY25', revenue: 4580, costs: 2880, profit: 1700, coalProduction: 155 },
        { quarter: 'Q2 FY25', revenue: 4720, costs: 2920, profit: 1800, coalProduction: 161 },
        { quarter: 'Q3 FY25', revenue: 4856, costs: 2943, profit: 1913, coalProduction: 165 }
    ];

    // Department-wise Budget Allocation for Coal Operations
    const departmentBudget = [
        { department: 'Mining Operations', allocated: 1850, utilized: 1520, percentage: 82 },
        { department: 'Equipment & Machinery', allocated: 980, utilized: 765, percentage: 78 },
        { department: 'Safety & Compliance', allocated: 650, utilized: 585, percentage: 90 },
        { department: 'Transportation & Logistics', allocated: 720, utilized: 540, percentage: 75 },
        { department: 'Exploration & Planning', allocated: 450, utilized: 315, percentage: 70 },
        { department: 'Environmental Management', allocated: 380, utilized: 290, percentage: 76 }
    ];

    // Revenue Breakdown by Coal Type
    const revenueByCoalType = [
        { name: 'Coking Coal', value: 1850, color: '#f59e0b', percentage: 38 },
        { name: 'Thermal Coal', value: 2180, color: '#3b82f6', percentage: 45 },
        { name: 'Anthracite', value: 520, color: '#10b981', percentage: 11 },
        { name: 'Lignite', value: 306, color: '#8b5cf6', percentage: 6 }
    ];

    // Cash Flow Analysis
    const cashFlowData = [
        { month: 'Apr', inflow: 680, outflow: 420, netCash: 260 },
        { month: 'May', inflow: 720, outflow: 450, netCash: 270 },
        { month: 'Jun', inflow: 695, outflow: 480, netCash: 215 },
        { month: 'Jul', inflow: 750, outflow: 465, netCash: 285 },
        { month: 'Aug', inflow: 780, outflow: 490, netCash: 290 },
        { month: 'Sep', inflow: 810, outflow: 505, netCash: 305 },
        { month: 'Oct', inflow: 825, outflow: 515, netCash: 310 }
    ];

    // Financial Performance Radar
    const performanceMetrics = [
        { metric: 'Revenue Growth', value: 85 },
        { metric: 'Cost Efficiency', value: 78 },
        { metric: 'Profit Margin', value: 82 },
        { metric: 'ROI', value: 75 },
        { metric: 'Budget Adherence', value: 88 },
        { metric: 'Cash Flow', value: 80 }
    ];

    // Major Expenditures
    const majorExpenditures = [
        { category: 'Labour & Wages', amount: 1250, percentage: 42, icon: Building2 },
        { category: 'Equipment Maintenance', amount: 680, percentage: 23, icon: Wallet },
        { category: 'Fuel & Energy', amount: 520, percentage: 18, icon: TrendingUp },
        { category: 'Safety Measures', amount: 320, percentage: 11, icon: Receipt },
        { category: 'Others', amount: 173, percentage: 6, icon: FileText }
    ];

    // Recent Transactions
    const recentTransactions = [
        { 
            id: 'TXN-2024-1247', 
            description: 'Mining Equipment Purchase - Excavators', 
            amount: -245000000, 
            date: '2025-12-08', 
            type: 'debit',
            category: 'Capital Expenditure'
        },
        { 
            id: 'TXN-2024-1246', 
            description: 'Coal Sales - Thermal Coal (5000 MT)', 
            amount: 420000000, 
            date: '2025-12-07', 
            type: 'credit',
            category: 'Revenue'
        },
        { 
            id: 'TXN-2024-1245', 
            description: 'Safety Equipment & PPE', 
            amount: -18500000, 
            date: '2025-12-06', 
            type: 'debit',
            category: 'Operational Expense'
        },
        { 
            id: 'TXN-2024-1244', 
            description: 'Government Subsidy - Q3 FY25', 
            amount: 150000000, 
            date: '2025-12-05', 
            type: 'credit',
            category: 'Subsidy'
        },
        { 
            id: 'TXN-2024-1243', 
            description: 'Transportation Services', 
            amount: -35000000, 
            date: '2025-12-04', 
            type: 'debit',
            category: 'Logistics'
        }
    ];

    const formatCurrency = (amount) => {
        const absAmount = Math.abs(amount);
        if (absAmount >= 10000000) {
            return `₹${(absAmount / 10000000).toFixed(2)} Cr`;
        }
        return `₹${(absAmount / 100000).toFixed(2)} L`;
    };

    const getColorClasses = (color) => {
        const colors = {
            emerald: isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600',
            orange: isDark ? 'bg-orange-900/20 border-orange-700/50 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600',
            blue: isDark ? 'bg-blue-900/20 border-blue-700/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600',
            purple: isDark ? 'bg-purple-900/20 border-purple-700/50 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${textColor}`}>Finance & Budget Management</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Coal sector financial overview and budget tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className={`px-4 py-2 rounded-lg border font-medium text-sm ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                        <option>FY 2023-24</option>
                        <option>FY 2024-25</option>
                        <option>FY 2025-26</option>
                    </select>
                    <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                        className={`px-4 py-2 rounded-lg border font-medium text-sm ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                        <option>Q1</option>
                        <option>Q2</option>
                        <option>Q3</option>
                        <option>Q4</option>
                    </select>
                    <button className={`p-2 rounded-lg border transition-all hover:scale-105 ${
                        isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}>
                        <Download size={18} className={iconColor} />
                    </button>
                </div>
            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {financialMetrics.map((metric, index) => (
                    <div
                        key={index}
                        className={`${cardBg} p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                                <metric.Icon size={24} strokeWidth={2.5} className={iconColor} />
                            </div>
                            <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-md ${
                                metric.trend === 'up' ? isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-700 bg-emerald-50' : isDark ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-50'
                            }`}>
                                {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {metric.change}
                            </span>
                        </div>
                        <p className={`text-sm font-medium mb-1 ${subTextColor}`}>{metric.label}</p>
                        <p className={`text-3xl font-bold mb-1 ${textColor}`}>{metric.value}</p>
                        <p className={`text-xs ${subTextColor}`}>{metric.subtitle}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section - Using Lucide Icons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quarterly Revenue vs Cost - Visual Card */}
                <div className={`${cardBg} p-6 rounded-xl border-2 shadow-sm hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                                <Activity className={iconColor} size={20} />
                                Quarterly Revenue & Cost Trend
                            </h3>
                            <p className={`text-xs ${subTextColor} mt-1`}>Last 7 quarters performance</p>
                        </div>
                        <LineChartIcon className={iconColor} size={32} />
                    </div>
                    
                    <div className="space-y-3">
                        {quarterlyData.map((data, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                                isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-semibold text-sm ${textColor}`}>{data.quarter}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        isDark ? 'bg-emerald-800/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {data.coalProduction} MT Coal
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>Revenue</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            ₹{data.revenue} Cr
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>Costs</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                            ₹{data.costs} Cr
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs ${subTextColor}`}>Profit</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                            ₹{data.profit} Cr
                                        </p>
                                    </div>
                                </div>
                                {/* Visual Progress Bar */}
                                <div className="mt-3 h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                                        style={{ width: `${(data.profit / data.revenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Coal Type - Visual Card */}
                <div className={`${cardBg} p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                                <PieChartIcon className={iconColor} size={20} />
                                Revenue by Coal Type
                            </h3>
                            <p className={`text-xs ${subTextColor} mt-1`}>Distribution across coal varieties</p>
                        </div>
                        <div className={`text-2xl font-bold ${textColor}`}>
                            ₹4,856 Cr
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {revenueByCoalType.map((type, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: type.color }}
                                        />
                                        <span className={`font-semibold text-sm ${textColor}`}>{type.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${textColor}`}>₹{type.value} Cr</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            isDark ? 'bg-slate-700' : 'bg-slate-100'
                                        }`}>
                                            {type.percentage}%
                                        </span>
                                    </div>
                                </div>
                                <div className={`h-2.5 rounded-full overflow-hidden ${
                                    isDark ? 'bg-slate-700' : 'bg-slate-200'
                                }`}>
                                    <div 
                                        className="h-full transition-all duration-500"
                                        style={{ 
                                            width: `${type.percentage}%`,
                                            backgroundColor: type.color 
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Budget Utilization - Visual Card */}
                <div className={`${cardBg} p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                                <Building2 className={iconColor} size={20} />
                                Department Budget Status
                            </h3>
                            <p className={`text-xs ${subTextColor} mt-1`}>Allocated vs Utilized</p>
                        </div>
                        <BarChart3 className={iconColor} size={32} />
                    </div>
                    
                    <div className="space-y-4">
                        {departmentBudget.map((dept, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${
                                isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-semibold text-sm ${textColor}`}>{dept.department}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        dept.percentage >= 85 ? 'bg-emerald-500/20 text-emerald-600' :
                                        dept.percentage >= 70 ? 'bg-blue-500/20 text-blue-600' :
                                        'bg-orange-500/20 text-orange-600'
                                    }`}>
                                        {dept.percentage}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs mb-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className={subTextColor}>Allocated: ₹{dept.allocated} Cr</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className={subTextColor}>Utilized: ₹{dept.utilized} Cr</span>
                                    </div>
                                </div>
                                <div className={`h-3 rounded-full overflow-hidden ${
                                    isDark ? 'bg-slate-700' : 'bg-slate-200'
                                }`}>
                                    <div className="h-full flex">
                                        <div 
                                            className="bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${dept.percentage}%` }}
                                        />
                                        <div 
                                            className="bg-blue-500/30"
                                            style={{ width: `${100 - dept.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cash Flow Analysis - Visual Card */}
                <div className={`${cardBg} p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                                <Wallet className={iconColor} size={20} />
                                Monthly Cash Flow
                            </h3>
                            <p className={`text-xs ${subTextColor} mt-1`}>Inflow vs Outflow analysis</p>
                        </div>
                        <TrendingUp className={iconColor} size={32} />
                    </div>
                    
                    <div className="space-y-4">
                        {cashFlowData.map((flow, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${
                                isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`font-semibold ${textColor}`}>{flow.month}</span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${
                                        flow.netCash > 0 
                                            ? 'bg-emerald-500/20 text-emerald-600' 
                                            : 'bg-red-500/20 text-red-600'
                                    }`}>
                                        Net: ₹{flow.netCash} Cr
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs ${subTextColor}`}>Inflow</span>
                                            <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                ₹{flow.inflow}
                                            </span>
                                        </div>
                                        <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${(flow.inflow / 850) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs ${subTextColor}`}>Outflow</span>
                                            <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                ₹{flow.outflow}
                                            </span>
                                        </div>
                                        <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div 
                                                className="h-full bg-red-500 rounded-full transition-all duration-500"
                                                style={{ width: `${(flow.outflow / 850) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Two Column Layout - Expenditures & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Major Expenditures */}
                <div className={`${cardBg} p-6 rounded-xl border shadow-sm`}>
                    <h3 className={`text-lg font-bold mb-5 ${textColor}`}>💸 Major Expenditure Categories</h3>
                    <div className="space-y-4">
                        {majorExpenditures.map((exp, index) => (
                            <div key={index} className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                                isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={iconBg + ' p-2 rounded-lg'}>
                                            <exp.icon size={18} className={iconColor} />
                                        </div>
                                        <span className={`text-sm font-semibold ${textColor}`}>{exp.category}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {exp.percentage}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-lg font-bold ${textColor}`}>
                                        ₹{exp.amount} Cr
                                    </span>
                                    <div className={`w-16 h-1.5 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                                        <div 
                                            className="h-full rounded-full bg-orange-500" 
                                            style={{ width: `${exp.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className={`lg:col-span-2 ${cardBg} p-6 rounded-xl border shadow-sm`}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className={`text-lg font-bold ${textColor}`}>📋 Recent Financial Transactions</h3>
                        <button className={`text-sm font-medium ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-700 hover:text-gray-900'}`}>
                            View All →
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentTransactions.map((txn) => (
                            <div
                                key={txn.id}
                                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                                    isDark ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : 'bg-gray-50 border-gray-200 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                                                isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                {txn.id}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                txn.type === 'credit' 
                                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                                    : 'bg-red-500/10 text-red-600'
                                            }`}>
                                                {txn.category}
                                            </span>
                                        </div>
                                        <p className={`font-medium text-sm ${textColor} mb-1`}>{txn.description}</p>
                                        <p className={`text-xs ${subTextColor}`}>
                                            <Calendar size={12} className="inline mr-1" />
                                            {new Date(txn.date).toLocaleDateString('en-IN', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${
                                            txn.type === 'credit' 
                                                ? 'text-emerald-600' 
                                                : 'text-red-600'
                                        }`}>
                                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Financial Performance Metrics - Visual Card */}
            <div className={`${cardBg} p-6 rounded-xl border shadow-sm`}>
                <h3 className={`text-lg font-bold mb-6 ${textColor} flex items-center gap-2`}>
                    <Activity className={iconColor} size={20} />
                    Financial Performance Metrics
                </h3>
                
                {/* Hexagonal Radar Chart */}
                <div className="flex items-center justify-center mb-8">
                    <div className="relative w-[400px] h-[400px]">
                        {/* Background Hexagon Grid */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                            <defs>
                                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid Lines - 5 levels */}
                            {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => {
                                const points = performanceMetrics.map((_, i) => {
                                    const angle = (Math.PI / 2) - (i * 2 * Math.PI / 6);
                                    const radius = 150 * scale;
                                    const x = 200 + radius * Math.cos(angle);
                                    const y = 200 - radius * Math.sin(angle);
                                    return `${x},${y}`;
                                }).join(' ');
                                
                                return (
                                    <polygon
                                        key={idx}
                                        points={points}
                                        fill="none"
                                        stroke={isDark ? '#334155' : '#e2e8f0'}
                                        strokeWidth="1"
                                    />
                                );
                            })}
                            
                            {/* Axis Lines */}
                            {performanceMetrics.map((_, i) => {
                                const angle = (Math.PI / 2) - (i * 2 * Math.PI / 6);
                                const x = 200 + 150 * Math.cos(angle);
                                const y = 200 - 150 * Math.sin(angle);
                                return (
                                    <line
                                        key={i}
                                        x1="200"
                                        y1="200"
                                        x2={x}
                                        y2={y}
                                        stroke={isDark ? '#334155' : '#e2e8f0'}
                                        strokeWidth="1"
                                    />
                                );
                            })}
                            
                            {/* Data Polygon */}
                            <polygon
                                points={performanceMetrics.map((metric, i) => {
                                    const angle = (Math.PI / 2) - (i * 2 * Math.PI / 6);
                                    const radius = 150 * (metric.value / 100);
                                    const x = 200 + radius * Math.cos(angle);
                                    const y = 200 - radius * Math.sin(angle);
                                    return `${x},${y}`;
                                }).join(' ')}
                                fill={isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(71, 85, 105, 0.1)'}
                                stroke={isDark ? '#94a3b8' : '#475569'}
                                strokeWidth="3"
                                strokeLinejoin="round"
                            />
                            
                            {/* Data Points */}
                            {performanceMetrics.map((metric, i) => {
                                const angle = (Math.PI / 2) - (i * 2 * Math.PI / 6);
                                const radius = 150 * (metric.value / 100);
                                const x = 200 + radius * Math.cos(angle);
                                const y = 200 - radius * Math.sin(angle);
                                return (
                                    <circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        fill={isDark ? '#94a3b8' : '#475569'}
                                        stroke="#fff"
                                        strokeWidth="2"
                                    />
                                );
                            })}
                        </svg>
                        
                        {/* Labels */}
                        {performanceMetrics.map((metric, i) => {
                            const angle = (Math.PI / 2) - (i * 2 * Math.PI / 6);
                            const labelRadius = 180;
                            const x = 200 + labelRadius * Math.cos(angle);
                            const y = 200 - labelRadius * Math.sin(angle);
                            
                            return (
                                <div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <div className={`text-center px-2 py-1 rounded-lg ${
                                        isDark ? 'bg-slate-800/90 border border-slate-700' : 'bg-white/90 border border-gray-200'
                                    }`}>
                                        <p className={`text-xs font-semibold whitespace-nowrap ${textColor}`}>
                                            {metric.metric}
                                        </p>
                                        <p className={`text-lg font-bold ${textColor}`}>
                                            {metric.value}%
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Center Label */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className={`text-center px-4 py-2 rounded-lg border-2 ${
                                isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300'
                            }`}>
                                <p className={`text-xs ${subTextColor}`}>Overall Score</p>
                                <p className={`text-2xl font-bold ${textColor}`}>
                                    {Math.round(performanceMetrics.reduce((sum, m) => sum + m.value, 0) / performanceMetrics.length)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                
            </div>
        </div>
    );
}
