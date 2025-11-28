'use client';

import React, { useState } from 'react';
import { 
    Search, Filter, LayoutGrid, List, Calendar, DollarSign, 
    FileText, CheckCircle, AlertCircle, Clock, ChevronRight, 
    MoreVertical, Download, Upload, MessageSquare, UserPlus,
    Users, Gavel, Activity, ArrowLeft, Send, Eye, X,
    TrendingUp, PieChart, BarChart2
} from 'lucide-react';

// --- Mock Data for Projects ---
const MOCK_PROJECTS = [
    {
        id: 'PROJ-2024-015',
        title: 'Autonomous Drone Surveillance for Open Cast Mines',
        pi: 'Dr. S. Verma',
        institution: 'IIT Kanpur',
        startDate: '2024-01-15',
        endDate: '2026-01-14',
        totalBudget: 8500000,
        spentBudget: 4200000,
        status: 'On Track',
        progress: 65,
        nextMilestone: 'Field Trials Phase 1',
        nextMilestoneDate: '2025-12-15',
        description: 'Deployment of autonomous drones for real-time surveillance and volumetric analysis of stockpiles.',
        milestones: [
            { id: 1, title: 'Literature Survey & Design', date: '2024-03-15', status: 'Completed' },
            { id: 2, title: 'Prototype Development', date: '2024-09-15', status: 'Completed' },
            { id: 3, title: 'Lab Testing', date: '2025-03-15', status: 'Completed' },
            { id: 4, title: 'Field Trials Phase 1', date: '2025-12-15', status: 'Pending' },
            { id: 5, title: 'Final Report', date: '2026-01-14', status: 'Pending' }
        ],
        expenditure: [
            { category: 'Equipment', allocated: 4000000, spent: 3500000 },
            { category: 'Manpower', allocated: 2500000, spent: 500000 },
            { category: 'Consumables', allocated: 1000000, spent: 100000 },
            { category: 'Travel', allocated: 500000, spent: 50000 },
            { category: 'Contingency', allocated: 500000, spent: 50000 }
        ]
    },
    {
        id: 'PROJ-2023-089',
        title: 'Coal Quality Analysis using Spectral Imaging',
        pi: 'Dr. M. Nair',
        institution: 'NIT Trichy',
        startDate: '2023-08-01',
        endDate: '2025-07-31',
        totalBudget: 6000000,
        spentBudget: 5800000,
        status: 'Delayed',
        progress: 85,
        nextMilestone: 'Final Validation',
        nextMilestoneDate: '2025-06-30',
        description: 'Non-contact coal quality estimation using hyperspectral imaging techniques.',
        milestones: [
            { id: 1, title: 'System Design', date: '2023-11-01', status: 'Completed' },
            { id: 2, title: 'Data Collection', date: '2024-05-01', status: 'Completed' },
            { id: 3, title: 'Algorithm Development', date: '2024-11-01', status: 'Completed' },
            { id: 4, title: 'Final Validation', date: '2025-06-30', status: 'Delayed' }
        ],
        expenditure: [
            { category: 'Equipment', allocated: 3000000, spent: 3000000 },
            { category: 'Manpower', allocated: 2000000, spent: 1800000 },
            { category: 'Consumables', allocated: 500000, spent: 500000 },
            { category: 'Travel', allocated: 250000, spent: 250000 },
            { category: 'Contingency', allocated: 250000, spent: 250000 }
        ]
    },
    {
        id: 'PROJ-2024-003',
        title: 'Underground Communication Network',
        pi: 'Dr. P. Kumar',
        institution: 'ISM Dhanbad',
        startDate: '2024-02-01',
        endDate: '2025-08-01',
        totalBudget: 5000000,
        spentBudget: 1500000,
        status: 'On Track',
        progress: 40,
        nextMilestone: 'Hardware Integration',
        nextMilestoneDate: '2025-01-15',
        description: 'Robust mesh network for underground mine communication.',
        milestones: [
            { id: 1, title: 'Requirement Analysis', date: '2024-04-01', status: 'Completed' },
            { id: 2, title: 'Simulation', date: '2024-08-01', status: 'Completed' },
            { id: 3, title: 'Hardware Integration', date: '2025-01-15', status: 'Pending' },
            { id: 4, title: 'Field Testing', date: '2025-06-01', status: 'Pending' }
        ],
        expenditure: [
            { category: 'Equipment', allocated: 2500000, spent: 500000 },
            { category: 'Manpower', allocated: 1500000, spent: 800000 },
            { category: 'Consumables', allocated: 500000, spent: 100000 },
            { category: 'Travel', allocated: 250000, spent: 50000 },
            { category: 'Contingency', allocated: 250000, spent: 50000 }
        ]
    }
];

// --- Components ---

const ProjectCard = ({ project, onClick, theme }) => {
    const isDark = theme === 'dark' || theme === 'darkest';
    
    return (
        <div 
            onClick={() => onClick(project)}
            className={`${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500'} border rounded-xl p-6 transition-all cursor-pointer group shadow-sm`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`text-xs font-mono px-2 py-1 rounded mb-2 inline-block ${isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'}`}>{project.id}</span>
                    <h3 className={`${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'} font-semibold text-lg line-clamp-1 transition-colors`}>{project.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    project.status === 'On Track' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200') :
                    project.status === 'Delayed' ? (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200') :
                    (isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200')
                }`}>
                    {project.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Principal Investigator</p>
                    <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <Users size={14} /> {project.pi}
                    </p>
                </div>
                <div>
                    <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Institution</p>
                    <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <FileText size={14} /> {project.institution}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Progress</span>
                        <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>{project.progress}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div 
                            className={`h-full rounded-full ${
                                project.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                            }`} 
                            style={{ width: `${project.progress}%` }}
                        ></div>
                    </div>
                </div>
                
                <div className={`flex justify-between items-center pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Next Milestone</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.nextMilestone}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{project.nextMilestoneDate}</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Budget Utilized</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {((project.spentBudget / project.totalBudget) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetailView = ({ project, onBack, theme }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const isDark = theme === 'dark' || theme === 'darkest';

    const bgClass = isDark ? 'bg-slate-950' : 'bg-slate-50';
    const cardBgClass = isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';

    return (
        <div className={`h-full flex flex-col ${bgClass}`}>
            {/* Header */}
            <div className={`p-6 border-b ${borderClass} flex items-center gap-4`}>
                <button onClick={onBack} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className={`text-xl font-bold ${textClass}`}>{project.title}</h1>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'}`}>{project.id}</span>
                    </div>
                    <div className={`flex items-center gap-4 text-sm ${subTextClass}`}>
                        <span>{project.pi}</span>
                        <span>•</span>
                        <span>{project.institution}</span>
                        <span>•</span>
                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Total Budget: ₹{project.totalBudget.toLocaleString()}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'}`}>
                        Download Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                        Update Progress
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="col-span-2 space-y-6">
                        {/* Milestones */}
                        <div className={`${cardBgClass} border rounded-xl p-6`}>
                            <h3 className={`text-lg font-semibold ${textClass} mb-6`}>Project Milestones</h3>
                            <div className="relative">
                                <div className={`absolute left-2 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                                <div className="space-y-8">
                                    {project.milestones.map((milestone) => (
                                        <div key={milestone.id} className="relative pl-8">
                                            <div className={`absolute left-0 top-1.5 w-4.5 h-4.5 -ml-[7px] rounded-full border-2 ${
                                                milestone.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' :
                                                milestone.status === 'Delayed' ? 'bg-red-500 border-red-500' :
                                                (isDark ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300')
                                            }`}></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`font-medium ${
                                                        milestone.status === 'Completed' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                                                        milestone.status === 'Delayed' ? (isDark ? 'text-red-400' : 'text-red-600') :
                                                        textClass
                                                    }`}>{milestone.title}</h4>
                                                    <p className={`text-sm ${subTextClass}`}>{milestone.date}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded border ${
                                                    milestone.status === 'Completed' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200') :
                                                    milestone.status === 'Delayed' ? (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200') :
                                                    (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')
                                                }`}>{milestone.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className={`${cardBgClass} border rounded-xl p-6`}>
                            <h3 className={`text-lg font-semibold ${textClass} mb-6`}>Financial Utilization</h3>
                            <div className="space-y-4">
                                {project.expenditure.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item.category}</span>
                                            <span className={subTextClass}>
                                                ₹{item.spent.toLocaleString()} / <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>₹{item.allocated.toLocaleString()}</span>
                                            </span>
                                        </div>
                                        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                            <div 
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${(item.spent / item.allocated) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div className={`${cardBgClass} border rounded-xl p-6`}>
                            <h3 className={`text-sm font-semibold ${subTextClass} uppercase tracking-wider mb-4`}>Project Health</h3>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity className="text-blue-400" size={20} />
                                        <span className={`${isDark ? 'text-slate-200' : 'text-slate-700'} font-medium`}>Overall Progress</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${textClass}`}>{project.progress}%</p>
                                </div>
                                <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <DollarSign className="text-emerald-400" size={20} />
                                        <span className={`${isDark ? 'text-slate-200' : 'text-slate-700'} font-medium`}>Funds Utilized</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${textClass}`}>
                                        {((project.spentBudget / project.totalBudget) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="text-purple-400" size={20} />
                                        <span className={`${isDark ? 'text-slate-200' : 'text-slate-700'} font-medium`}>Time Elapsed</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${textClass}`}>45%</p>
                                </div>
                            </div>
                        </div>

                        <div className={`${cardBgClass} border rounded-xl p-6`}>
                            <h3 className={`text-sm font-semibold ${subTextClass} uppercase tracking-wider mb-4`}>Quick Actions</h3>
                            <div className="space-y-2">
                                <button className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${isDark ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <MessageSquare size={18} />
                                    <span>Contact PI</span>
                                </button>
                                <button className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${isDark ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <FileText size={18} />
                                    <span>View Documents</span>
                                </button>
                                <button className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors ${isDark ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <TrendingUp size={18} />
                                    <span>Generate Report</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ProjectsSection({ theme }) {
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const isDark = theme === 'dark' || theme === 'darkest';

    const inputBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900';
    const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';

    if (selectedProject) {
        return <ProjectDetailView project={selectedProject} onBack={() => setSelectedProject(null)} theme={theme} />;
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subTextClass}`} />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputBgClass} rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 border`}
                        />
                    </div>
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}>
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
                {MOCK_PROJECTS.map(project => (
                    <ProjectCard key={project.id} project={project} onClick={setSelectedProject} theme={theme} />
                ))}
            </div>
        </div>
    );
}
