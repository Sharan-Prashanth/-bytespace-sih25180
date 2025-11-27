'use client';

import {
    Calendar,
    DollarSign,
    FileText,
    LayoutGrid,
    List,
    Search
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ProposalDetail from "../Proposals/ProposalDetail";

// Mock Data
const PROPOSALS_DATA = [
    {
        id: "PROP001",
        title: "AI-Powered Coal Quality Assessment System",
        submitterName: "Dr. Rajesh Kumar",
        category: "Technology",
        department: "IIT Delhi",
        status: "Approved",
        budget: "₹25,00,000",
        dateSubmitted: "Sep 01, 2025",
        summary: "This proposal aims to develop an AI-driven system for real-time coal quality assessment using computer vision and machine learning techniques. The system will reduce manual inspection time and improve accuracy."
    },
    {
        id: "PROP002",
        title: "Sustainable Mining Waste Management",
        submitterName: "Dr. Priya Sharma",
        category: "Environment",
        department: "CSIR-CIMFR",
        status: "Pending",
        budget: "₹40,00,000",
        dateSubmitted: "Sep 05, 2025",
        summary: "A comprehensive study on managing mining waste effectively to minimize environmental impact. The project focuses on converting waste into usable construction materials."
    },
    {
        id: "PROP003",
        title: "Advanced Coal Gasification Process",
        submitterName: "Dr. Amit Patel",
        category: "Energy",
        department: "NEIST",
        status: "Rejected",
        budget: "₹15,00,000",
        dateSubmitted: "Aug 20, 2025",
        summary: "Investigation into novel catalysts for improving the efficiency of coal gasification. The proposal outlines a 2-year research plan with pilot plant testing."
    },
    {
        id: "PROP004",
        title: "Digital Twin for Mining Operations",
        submitterName: "Dr. Sunita Mehta",
        category: "Technology",
        department: "NIT Rourkela",
        status: "Pending",
        budget: "₹35,00,000",
        dateSubmitted: "Sep 10, 2025",
        summary: "Creation of a digital twin for underground mining operations to simulate scenarios, optimize workflows, and enhance safety protocols."
    },
    {
        id: "PROP005",
        title: "Carbon Capture Technology Research",
        submitterName: "Dr. Vikram Singh",
        category: "Environment",
        department: "IIT Kharagpur",
        status: "Approved",
        budget: "₹50,00,000",
        dateSubmitted: "Sep 15, 2025",
        summary: "Research into cost-effective carbon capture technologies specifically designed for coal-fired power plants. Includes feasibility study and prototype development."
    }
];

export default function ProposalsSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [selectedProposal, setSelectedProposal] = useState(null);
    const router = useRouter();

    // Handle URL query param for proposal ID
    useEffect(() => {
        if (router.query.proposalId) {
            const proposal = PROPOSALS_DATA.find(p => p.id === router.query.proposalId);
            if (proposal) setSelectedProposal(proposal);
        } else {
            setSelectedProposal(null);
        }
    }, [router.query.proposalId]);

    const handleProposalClick = (proposal) => {
        setSelectedProposal(proposal);
        // Shallow routing
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, proposalId: proposal.id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedProposal(null);
        const { proposalId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const filteredProposals = PROPOSALS_DATA.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100';
            default: return isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-500';
            case 'Rejected': return 'bg-red-500';
            default: return 'bg-amber-500';
        }
    };

    if (selectedProposal) {
        return <ProposalDetail proposal={selectedProposal} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Projects & Proposals</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Track and manage all research proposals and ongoing projects.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
                    <FileText size={18} />
                    <span>New Proposal</span>
                </button>
            </div>

            {/* Filters & View Toggle */}
            <div className={`${cardBg} p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row items-center gap-4`}>
                {/* Search Bar */}
                <div className="relative flex-1 group w-full">
                    <Search
                        size={18}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
                            ${isDark ? 'text-slate-500 group-focus-within:text-slate-300' : 'text-slate-400 group-focus-within:text-slate-600'}
                        `}
                    />
                    <input
                        type="text"
                        placeholder="Search proposals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border outline-none shadow-sm hover:shadow-md
                            ${isDarkest
                                ? 'bg-neutral-950 border-neutral-800 text-white placeholder-slate-600 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                                : isDark
                                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'}
                        `}
                    />
                </div>

                {/* View Toggle */}
                <div className={`flex items-center p-1 rounded-xl border ${isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                        title="Table View"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'card'
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                        title="Card View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'table' ? (
                // Table View
                <div className={`${cardBg} rounded-3xl shadow-sm border overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${borderColor}`}>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Proposal Title</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Submitter</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Category</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Budget</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Date</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {filteredProposals.map((proposal) => (
                                    <tr
                                        key={proposal.id}
                                        onClick={() => handleProposalClick(proposal)}
                                        className={`group transition-colors cursor-pointer ${hoverBg}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${textColor} line-clamp-1`}>{proposal.title}</div>
                                                    <div className={`text-xs ${subTextColor}`}>{proposal.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.submitterName}</div>
                                            <div className={`text-xs ${subTextColor}`}>{proposal.department}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.category}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(proposal.status)}`}></div>
                                                {proposal.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proposal.budget}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className={`text-sm font-medium ${subTextColor}`}>{proposal.dateSubmitted}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            onClick={() => handleProposalClick(proposal)}
                            className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <FileText size={24} />
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(proposal.status)}`}></div>
                                    {proposal.status}
                                </span>
                            </div>

                            <h3 className={`font-bold text-lg mb-2 line-clamp-2 h-14 ${textColor}`}>{proposal.title}</h3>

                            <div className="flex items-center gap-2 mb-6">
                                <span className={`text-xs font-medium px-2 py-1 rounded-md ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {proposal.category}
                                </span>
                                <span className={`text-xs font-medium ${subTextColor}`}>• {proposal.department}</span>
                            </div>

                            <div className={`flex items-center justify-between pt-4 border-t mt-auto ${borderColor}`}>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                    <span className={`text-sm font-bold ${textColor}`}>{proposal.budget}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className={subTextColor} />
                                    <span className={`text-xs font-medium ${subTextColor}`}>{proposal.dateSubmitted}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
