'use client';

import {
    Activity,
    BarChart3,
    ChevronDown,
    Filter,
    Globe,
    Layers,
    MapPin,
    RefreshCw,
    TrendingUp,
    Zap
} from "lucide-react";
import { useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// --- MOCK DATA ---
const stateProposalsData = {
    "Jharkhand": { count: 44, history: [10, 15, 12, 18, 22, 28, 35, 44], budget: "₹85.5 Cr", active: 32, completed: 12 },
    "West Bengal": { count: 38, history: [8, 12, 15, 20, 25, 30, 34, 38], budget: "₹72.3 Cr", active: 28, completed: 10 },
    "Odisha": { count: 35, history: [7, 10, 14, 18, 22, 26, 30, 35], budget: "₹68.2 Cr", active: 25, completed: 10 },
    "Chhattisgarh": { count: 32, history: [6, 9, 12, 16, 20, 24, 28, 32], budget: "₹62.8 Cr", active: 24, completed: 8 },
    "Maharashtra": { count: 28, history: [5, 8, 11, 14, 18, 22, 25, 28], budget: "₹54.5 Cr", active: 20, completed: 8 },
    "Madhya Pradesh": { count: 25, history: [5, 7, 10, 13, 16, 19, 22, 25], budget: "₹48.2 Cr", active: 18, completed: 7 },
    "Telangana": { count: 22, history: [4, 6, 9, 12, 15, 18, 20, 22], budget: "₹42.5 Cr", active: 16, completed: 6 },
    "Andhra Pradesh": { count: 18, history: [3, 5, 7, 10, 12, 14, 16, 18], budget: "₹35.2 Cr", active: 13, completed: 5 },
    "Uttar Pradesh": { count: 15, history: [3, 4, 6, 8, 10, 12, 14, 15], budget: "₹28.8 Cr", active: 11, completed: 4 },
    "Tamil Nadu": { count: 12, history: [2, 3, 5, 6, 8, 9, 11, 12], budget: "₹22.5 Cr", active: 9, completed: 3 },
    "Rajasthan": { count: 10, history: [2, 3, 4, 5, 6, 7, 8, 10], budget: "₹18.2 Cr", active: 7, completed: 3 },
    "Gujarat": { count: 8, history: [1, 2, 3, 4, 5, 6, 7, 8], budget: "₹14.5 Cr", active: 6, completed: 2 },
    "Karnataka": { count: 6, history: [1, 2, 2, 3, 4, 5, 5, 6], budget: "₹10.8 Cr", active: 4, completed: 2 },
    "Kerala": { count: 4, history: [1, 1, 2, 2, 3, 3, 4, 4], budget: "₹7.2 Cr", active: 3, completed: 1 },
    "Bihar": { count: 8, history: [1, 2, 3, 4, 5, 6, 7, 8], budget: "₹15.5 Cr", active: 6, completed: 2 },
    "Assam": { count: 5, history: [1, 1, 2, 2, 3, 4, 4, 5], budget: "₹9.2 Cr", active: 4, completed: 1 },
    "Meghalaya": { count: 3, history: [1, 1, 1, 2, 2, 2, 3, 3], budget: "₹5.5 Cr", active: 2, completed: 1 },
};

const categoryData = [
    { name: 'Technology', value: 35, color: '#3b82f6' },
    { name: 'Environment', value: 28, color: '#10b981' },
    { name: 'Safety', value: 22, color: '#f59e0b' },
    { name: 'Production', value: 15, color: '#8b5cf6' },
];

const monthlyTrendData = [
    { month: 'Jan', proposals: 12, budget: 8.5 },
    { month: 'Feb', proposals: 15, budget: 10.2 },
    { month: 'Mar', proposals: 18, budget: 12.8 },
    { month: 'Apr', proposals: 22, budget: 15.5 },
    { month: 'May', proposals: 28, budget: 19.2 },
    { month: 'Jun', proposals: 32, budget: 22.8 },
    { month: 'Jul', proposals: 38, budget: 26.5 },
    { month: 'Aug', proposals: 42, budget: 30.2 },
    { month: 'Sep', proposals: 48, budget: 34.8 },
    { month: 'Oct', proposals: 52, budget: 38.5 },
    { month: 'Nov', proposals: 55, budget: 41.2 },
    { month: 'Dec', proposals: 58, budget: 44.8 },
];

// --- COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, subValue, color, theme }) => {
    const isDark = theme === 'dark' || theme === 'darkest';
    const colorClasses = {
        blue: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
        emerald: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        amber: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
        purple: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
    };

    return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                </div>
            </div>
            {subValue && (
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>
            )}
        </div>
    );
};

export default function GISMapSection({ theme = 'light' }) {
    const [selectedState, setSelectedState] = useState("Jharkhand");
    const [mapFilter, setMapFilter] = useState("proposals"); // proposals | budget | active
    const [timeRange, setTimeRange] = useState("all"); // all | year | quarter

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const getContainerClass = () => {
        if (isDarkest) return 'bg-black';
        if (isDark) return 'bg-slate-900';
        return 'bg-slate-50';
    };

    const getCardClass = () => {
        if (isDarkest) return 'bg-neutral-900 border-neutral-800';
        if (isDark) return 'bg-slate-800 border-slate-700';
        return 'bg-white border-slate-200';
    };

    const totalProposals = Object.values(stateProposalsData).reduce((sum, s) => sum + s.count, 0);
    const totalBudget = "₹409.23 Cr";
    const totalActive = Object.values(stateProposalsData).reduce((sum, s) => sum + s.active, 0);
    const totalCompleted = Object.values(stateProposalsData).reduce((sum, s) => sum + s.completed, 0);

    return (
        <div className={`min-h-screen p-6 ${getContainerClass()}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        GIS Map Analytics
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Geographic distribution of research proposals across India
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Filter */}
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className={`appearance-none pl-4 pr-10 py-2 rounded-xl border text-sm font-medium cursor-pointer ${isDark
                                ? 'bg-slate-800 border-slate-700 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                                }`}
                        >
                            <option value="all">All Time</option>
                            <option value="year">This Year</option>
                            <option value="quarter">This Quarter</option>
                        </select>
                        <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>

                    {/* Map Filter */}
                    <div className="relative">
                        <select
                            value={mapFilter}
                            onChange={(e) => setMapFilter(e.target.value)}
                            className={`appearance-none pl-4 pr-10 py-2 rounded-xl border text-sm font-medium cursor-pointer ${isDark
                                ? 'bg-slate-800 border-slate-700 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                                }`}
                        >
                            <option value="proposals">By Proposals</option>
                            <option value="budget">By Budget</option>
                            <option value="active">By Active Projects</option>
                        </select>
                        <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>

                    <button className={`p-2 rounded-xl border ${isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                        } transition-colors`}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={MapPin} label="Total Proposals" value={totalProposals} subValue="Across 17 states" color="blue" theme={theme} />
                <StatCard icon={Zap} label="Total Budget" value={totalBudget} subValue="Sanctioned amount" color="emerald" theme={theme} />
                <StatCard icon={Activity} label="Active Projects" value={totalActive} subValue="Currently ongoing" color="amber" theme={theme} />
                <StatCard icon={TrendingUp} label="Completed" value={totalCompleted} subValue="Successfully delivered" color="purple" theme={theme} />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Panel - State Details */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Selected State Card */}
                    <div className={`rounded-2xl border p-6 ${getCardClass()}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Selected Region
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                Active
                            </span>
                        </div>
                        <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedState}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Coal mining region
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {stateProposalsData[selectedState]?.count || 0}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Proposals</p>
                            </div>
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {stateProposalsData[selectedState]?.budget || "₹0"}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Budget</p>
                            </div>
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className={`text-2xl font-bold text-emerald-500`}>
                                    {stateProposalsData[selectedState]?.active || 0}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active</p>
                            </div>
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                <p className={`text-2xl font-bold text-blue-500`}>
                                    {stateProposalsData[selectedState]?.completed || 0}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed</p>
                            </div>
                        </div>
                    </div>

                    {/* State History Chart */}
                    <div className={`rounded-2xl border p-6 ${getCardClass()}`}>
                        <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Proposal Trend - {selectedState}
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={stateProposalsData[selectedState]?.history.map((val, idx) => ({ month: `Q${idx + 1}`, value: val })) || []}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="month" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category Distribution */}
                    <div className={`rounded-2xl border p-6 ${getCardClass()}`}>
                        <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Category Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                        borderRadius: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {categoryData.map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Map */}
                <div className="lg:col-span-8">
                    <div className={`rounded-2xl border overflow-hidden ${getCardClass()}`}>
                        {/* Map Header */}
                        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                                        <Globe size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>India Research Map</h3>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click on any state to view details</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                        <Layers size={14} className="inline mr-1" />
                                        Layers
                                    </button>
                                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                        <Filter size={14} className="inline mr-1" />
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Map Container - State Cards Grid */}
                        <div className={`relative p-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} style={{ minHeight: '550px' }}>
                            {/* State Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {Object.entries(stateProposalsData)
                                    .sort((a, b) => b[1].count - a[1].count)
                                    .map(([state, data]) => {
                                        const isSelected = selectedState === state;
                                        const maxCount = 44; // Jharkhand has highest
                                        const intensity = data.count / maxCount;
                                        
                                        return (
                                            <button
                                                key={state}
                                                onClick={() => setSelectedState(state)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                                    isSelected
                                                        ? isDark
                                                            ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30'
                                                            : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/30'
                                                        : isDark
                                                            ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {state.substring(0, 2).toUpperCase()}
                                                    </span>
                                                    <div 
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ 
                                                            backgroundColor: `rgba(59, 130, 246, ${0.3 + intensity * 0.7})` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <h4 className={`font-semibold text-sm mb-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {state}
                                                </h4>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-xl font-bold ${isSelected ? 'text-blue-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {data.count}
                                                    </span>
                                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>proposals</span>
                                                </div>
                                                {/* Mini progress bar */}
                                                <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                                                    <div 
                                                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                                        style={{ width: `${intensity * 100}%` }}
                                                    ></div>
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>

                            {/* Floating Stats */}
                            <div className={`absolute top-4 right-4 p-4 rounded-xl shadow-lg border max-w-[200px] ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Highest Activity</div>
                                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Jharkhand</div>
                                <div className="text-sm font-semibold text-blue-500">44 Proposals</div>
                            </div>

                            {/* Legend */}
                            <div className={`absolute bottom-4 right-4 p-3 rounded-xl border ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                                <div className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Proposal Density</div>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-20 rounded-full ${isDark ? 'bg-gradient-to-r from-slate-700 to-blue-500' : 'bg-gradient-to-r from-blue-100 to-blue-600'}`}></div>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Low → High</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend Chart */}
                    <div className={`rounded-2xl border p-6 mt-6 ${getCardClass()}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Monthly Proposal & Budget Trend
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Proposals</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Budget (Cr)</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="month" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                        borderRadius: '12px'
                                    }}
                                />
                                <Bar dataKey="proposals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="budget" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
