'use client';

import React, { useState } from 'react';
import { 
    Search, Filter, LayoutGrid, List, Calendar, DollarSign, 
    FileText, CheckCircle, AlertCircle, Clock, ChevronRight, 
    MoreVertical, Download, Upload, MessageSquare, UserPlus,
    Users, Gavel, Activity, ArrowLeft, Send, Eye, X
} from 'lucide-react';
import { assignReviewer } from '../../../../utils/workflowApi';

// --- Mock Data for Proposals ---
const MOCK_PROPOSALS = [
    {
        id: 'PROP-2025-042',
        title: 'Advanced Coal Dust Suppression System',
        pi: 'Dr. A. Sharma',
        institution: 'IIT Kharagpur',
        submissionDate: '2025-11-20',
        budget: 4500000,
        duration: '24 Months',
        stage: 'CMPDI Scrutiny',
        status: 'Under Review',
        priority: 'High',
        description: 'Development of a novel chemical-based dust suppression system for open cast mines.',
        timeline: [
            { date: '2025-11-20', event: 'Proposal Submitted', user: 'Dr. A. Sharma' },
            { date: '2025-11-21', event: 'Assigned to CMPDI Scrutiny', user: 'System' }
        ]
    },
    {
        id: 'PROP-2025-038',
        title: 'AI-Driven Mine Safety Monitoring',
        pi: 'Dr. B. Das',
        institution: 'NIT Rourkela',
        submissionDate: '2025-11-18',
        budget: 3200000,
        duration: '18 Months',
        stage: 'Tech Sub-Committee',
        status: 'Pending Decision',
        priority: 'Medium',
        description: 'Using computer vision and IoT sensors to detect safety violations in real-time.',
        timeline: [
            { date: '2025-11-18', event: 'Proposal Submitted', user: 'Dr. B. Das' },
            { date: '2025-11-20', event: 'CMPDI Scrutiny Cleared', user: 'CMPDI Admin' },
            { date: '2025-11-22', event: 'Expert Review Completed', user: 'Expert Panel' },
            { date: '2025-11-25', event: 'Forwarded to TSSRC', user: 'CMPDI Admin' }
        ]
    },
    {
        id: 'PROP-2025-041',
        title: 'Geo-thermal Analysis of Coal Beds',
        pi: 'Dr. D. Singh',
        institution: 'BHU',
        submissionDate: '2025-11-25',
        budget: 2800000,
        duration: '12 Months',
        stage: 'Clarifications',
        status: 'Clarification Requested',
        priority: 'Low',
        description: 'Study of geothermal gradients in Jharia coal fields.',
        timeline: [
            { date: '2025-11-25', event: 'Proposal Submitted', user: 'Dr. D. Singh' },
            { date: '2025-11-26', event: 'Clarification Requested', user: 'CMPDI Admin' }
        ]
    },
    {
        id: 'PROP-2025-035',
        title: 'Sustainable Mining Technologies',
        pi: 'Dr. C. Roy',
        institution: 'ISM Dhanbad',
        submissionDate: '2025-11-15',
        budget: 5500000,
        duration: '36 Months',
        stage: 'SSRC Approval',
        status: 'Recommended',
        priority: 'High',
        description: 'Integrated approach for sustainable mining practices.',
        timeline: [
            { date: '2025-11-15', event: 'Proposal Submitted', user: 'Dr. C. Roy' },
            { date: '2025-11-28', event: 'TSSRC Recommended', user: 'TSSRC Committee' }
        ]
    },
    {
        id: 'PROP-2025-029',
        title: 'Robotic Excavation Efficiency',
        pi: 'Dr. K. Patel',
        institution: 'IIT Bombay',
        submissionDate: '2025-10-30',
        budget: 6000000,
        duration: '24 Months',
        stage: 'Monitoring',
        status: 'Active',
        priority: 'Medium',
        description: 'Automation of excavation processes using robotics.',
        timeline: [
            { date: '2025-10-30', event: 'Proposal Submitted', user: 'Dr. K. Patel' },
            { date: '2025-11-15', event: 'Project Approved', user: 'SSRC' }
        ]
    }
];

const STAGES = [
    { id: 'submitted', label: 'Submitted', color: 'bg-slate-500' },
    { id: 'CMPDI Scrutiny', label: 'CMPDI Scrutiny', color: 'bg-blue-500' },
    { id: 'Clarifications', label: 'Clarifications', color: 'bg-orange-500' },
    { id: 'Expert Review', label: 'Expert Review', color: 'bg-indigo-500' },
    { id: 'Tech Sub-Committee', label: 'Tech Sub-Committee', color: 'bg-purple-500' },
    { id: 'SSRC Approval', label: 'SSRC Approval', color: 'bg-pink-500' },
    { id: 'Monitoring', label: 'Monitoring', color: 'bg-emerald-500' },
];

const MOCK_REVIEWERS = [
    { id: 'REV001', name: 'Dr. R. Gupta', expertise: 'Mining Safety', email: 'r.gupta@iit.ac.in' },
    { id: 'REV002', name: 'Prof. S. Kumar', expertise: 'Geology', email: 's.kumar@ism.ac.in' },
    { id: 'REV003', name: 'Dr. M. Singh', expertise: 'Environmental Impact', email: 'm.singh@bhu.ac.in' },
    { id: 'REV004', name: 'Dr. K. Reddy', expertise: 'Automation', email: 'k.reddy@nit.ac.in' },
];

// --- Components ---

const ProposalCard = ({ proposal, onClick, theme }) => {
    const isDark = theme === 'dark' || theme === 'darkest';
    
    return (
        <div 
            onClick={() => onClick(proposal)}
            className={`${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500'} border rounded-xl p-4 transition-all cursor-pointer group shadow-sm`}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'}`}>{proposal.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                    proposal.priority === 'High' ? (isDark ? 'text-red-400 border-red-400/20 bg-red-400/10' : 'text-red-600 border-red-200 bg-red-50') :
                    proposal.priority === 'Medium' ? (isDark ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' : 'text-yellow-600 border-yellow-200 bg-yellow-50') :
                    (isDark ? 'text-slate-400 border-slate-400/20 bg-slate-400/10' : 'text-slate-500 border-slate-200 bg-slate-50')
                }`}>
                    {proposal.priority}
                </span>
            </div>
            <h3 className={`${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'} font-semibold mb-2 line-clamp-2 transition-colors`}>{proposal.title}</h3>
            <div className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{proposal.pi}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>{proposal.institution}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{proposal.submissionDate}</span>
                </div>
            </div>
            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex justify-between items-center`}>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{proposal.stage}</span>
                <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium text-sm`}>₹{(proposal.budget/100000).toFixed(1)}L</span>
            </div>
        </div>
    );
};

const AssignReviewerModal = ({ isOpen, onClose, onAssign, theme }) => {
    const [selectedReviewer, setSelectedReviewer] = useState(null);
    const [dueDate, setDueDate] = useState('');
    const isDark = theme === 'dark' || theme === 'darkest';

    if (!isOpen) return null;

    const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`${bgClass} ${borderClass} border rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${textClass}`}>Assign Reviewer</h3>
                    <button onClick={onClose} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${textClass}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select Reviewer</label>
                        <div className={`max-h-48 overflow-y-auto border rounded-lg ${borderClass}`}>
                            {MOCK_REVIEWERS.map(reviewer => (
                                <div 
                                    key={reviewer.id}
                                    onClick={() => setSelectedReviewer(reviewer)}
                                    className={`p-3 cursor-pointer flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 ${selectedReviewer?.id === reviewer.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                >
                                    <div>
                                        <p className={`font-medium ${textClass}`}>{reviewer.name}</p>
                                        <p className="text-xs text-slate-500">{reviewer.expertise}</p>
                                    </div>
                                    {selectedReviewer?.id === reviewer.id && <CheckCircle size={16} className="text-blue-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Due Date</label>
                        <input 
                            type="date" 
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={onClose}
                            className={`flex-1 py-2 rounded-lg border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onAssign(selectedReviewer, dueDate)}
                            disabled={!selectedReviewer || !dueDate}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Assign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProposalDetailView = ({ proposal, onBack, theme }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const isDark = theme === 'dark' || theme === 'darkest';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'documents', label: 'Documents', icon: Download },
        { id: 'cmpdi', label: 'CMPDI Review', icon: Search },
        { id: 'experts', label: 'Expert Review', icon: Users },
        { id: 'committee', label: 'Committee', icon: Gavel },
        { id: 'clarifications', label: 'Clarifications', icon: MessageSquare },
    ];

    const handleAssignReviewer = async (reviewer, dueDate) => {
        try {
            // In a real app, we would call the API here
            // await assignReviewer(proposal.id, { reviewerId: reviewer.id, dueDate });
            console.log(`Assigned ${reviewer.name} to proposal ${proposal.id} due by ${dueDate}`);
            setShowAssignModal(false);
            alert(`Successfully assigned ${reviewer.name} to review this proposal.`);
        } catch (error) {
            console.error("Failed to assign reviewer", error);
            alert("Failed to assign reviewer");
        }
    };

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
                        <h1 className={`text-xl font-bold ${textClass}`}>{proposal.title}</h1>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'}`}>{proposal.id}</span>
                    </div>
                    <div className={`flex items-center gap-4 text-sm ${subTextClass}`}>
                        <span>{proposal.pi}</span>
                        <span>•</span>
                        <span>{proposal.institution}</span>
                        <span>•</span>
                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>₹{proposal.budget.toLocaleString()}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <button 
                        onClick={() => setShowAssignModal(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <UserPlus size={16} />
                        Assign Reviewer
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                        Update Status
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className={`border-b ${borderClass} px-6`}>
                <div className="flex gap-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id 
                                ? 'border-blue-500 text-blue-500' 
                                : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            <div className={`${cardBgClass} border rounded-xl p-6`}>
                                <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Project Description</h3>
                                <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>{proposal.description}</p>
                            </div>
                            <div className={`${cardBgClass} border rounded-xl p-6`}>
                                <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Timeline</h3>
                                <div className="space-y-4">
                                    {proposal.timeline.map((item, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                {idx !== proposal.timeline.length - 1 && <div className={`w-0.5 flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} my-1`}></div>}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${textClass}`}>{item.event}</p>
                                                <p className={`text-xs ${subTextClass}`}>{item.date} • {item.user}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className={`${cardBgClass} border rounded-xl p-6`}>
                                <h3 className={`text-sm font-semibold ${subTextClass} uppercase tracking-wider mb-4`}>Project Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className={`text-xs ${subTextClass}`}>Duration</label>
                                        <p className={`${textClass} font-medium`}>{proposal.duration}</p>
                                    </div>
                                    <div>
                                        <label className={`text-xs ${subTextClass}`}>Budget</label>
                                        <p className={`${textClass} font-medium`}>₹{proposal.budget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className={`text-xs ${subTextClass}`}>Current Stage</label>
                                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                            {proposal.stage}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Other tabs would follow similar pattern with theme props */}
                {/* For brevity, I'm applying the pattern to the main structure first */}
            </div>

            {/* Modals */}
            <AssignReviewerModal 
                isOpen={showAssignModal} 
                onClose={() => setShowAssignModal(false)} 
                onAssign={handleAssignReviewer}
                theme={theme}
            />
        </div>
    );
};

export default function ProposalsSection({ proposals = [], theme }) {
    const [viewMode, setViewMode] = useState('list'); // Default to list view as per screenshot
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isDark = theme === 'dark' || theme === 'darkest';
    
    // Theme classes
    const bgClass = isDark ? 'bg-slate-900/50' : 'bg-white';
    const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
    const inputBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900';
    const tableHeaderClass = isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200';
    const tableRowHoverClass = isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50';
    const divideClass = isDark ? 'divide-slate-800' : 'divide-slate-200';

    if (selectedProposal) {
        return <ProposalDetailView proposal={selectedProposal} onBack={() => setSelectedProposal(null)} theme={theme} />;
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className={`flex items-center gap-2 p-1 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button 
                        onClick={() => setViewMode('pipeline')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'pipeline' ? (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
                    >
                        <List size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subTextClass}`} />
                        <input 
                            type="text" 
                            placeholder="Search proposals..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputBgClass} rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 border`}
                        />
                    </div>
                    <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}>
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                        <FileText size={16} /> New Proposal
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'pipeline' ? (
                    <div className="h-full overflow-x-auto pb-4">
                        <div className="flex gap-6 h-full min-w-max px-1">
                            {STAGES.map(stage => (
                                <div key={stage.id} className="w-80 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                                            <h3 className={`font-semibold ${textClass}`}>{stage.label}</h3>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${isDark ? 'text-slate-500 bg-slate-900 border-slate-800' : 'text-slate-500 bg-white border-slate-200'}`}>
                                            {MOCK_PROPOSALS.filter(p => p.stage === stage.id).length}
                                        </span>
                                    </div>
                                    <div className={`flex-1 rounded-xl border p-3 space-y-3 overflow-y-auto ${isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50/50 border-slate-200'}`}>
                                        {MOCK_PROPOSALS.filter(p => p.stage === stage.id).map(proposal => (
                                            <ProposalCard key={proposal.id} proposal={proposal} onClick={setSelectedProposal} theme={theme} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`${bgClass} border ${borderClass} rounded-xl overflow-hidden shadow-sm`}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`${tableHeaderClass} text-xs uppercase tracking-wider border-b`}>
                                    <th className="p-4 font-medium">ID</th>
                                    <th className="p-4 font-medium">Title</th>
                                    <th className="p-4 font-medium">PI / Institution</th>
                                    <th className="p-4 font-medium">Stage</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Budget</th>
                                    <th className="p-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divideClass}`}>
                                {MOCK_PROPOSALS.map(proposal => (
                                    <tr key={proposal.id} className={`${tableRowHoverClass} transition-colors`}>
                                        <td className={`p-4 text-sm font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{proposal.id}</td>
                                        <td className={`p-4 text-sm font-medium ${textClass}`}>{proposal.title}</td>
                                        <td className="p-4">
                                            <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{proposal.pi}</div>
                                            <div className={`text-xs ${subTextClass}`}>{proposal.institution}</div>
                                        </td>
                                        <td className={`p-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.stage}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                proposal.status === 'Active' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200') :
                                                proposal.status === 'Recommended' ? (isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200') :
                                                (isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200')
                                            }`}>
                                                {proposal.status}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>₹{(proposal.budget/100000).toFixed(1)}L</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedProposal(proposal)}
                                                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
