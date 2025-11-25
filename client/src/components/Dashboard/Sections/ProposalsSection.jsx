'use client';

import {
    Eye,
    FileText,
    Filter,
    MoreHorizontal,
    Search,
    TrendingUp
} from "lucide-react";
import { useState } from "react";
import { PROPOSAL_STATUS, STATUS_CONFIG, formatDate } from "../../../utils/statusConfig";

// Mock Data
const PROPOSALS_DATA = [
    {
        id: "PROP001",
        title: "AI-Powered Coal Quality Assessment System",
        principalInvestigator: "Dr. Rajesh Kumar",
        organization: "IIT Delhi",
        currentStage: "CMPDI Review",
        status: PROPOSAL_STATUS.CMPDI_REVIEW,
        createdAt: "2025-09-01T10:00:00Z"
    },
    {
        id: "PROP002",
        title: "Sustainable Mining Waste Management",
        principalInvestigator: "Dr. Priya Sharma",
        organization: "CSIR-CIMFR",
        currentStage: "TSSRC Review",
        status: PROPOSAL_STATUS.TSSRC_REVIEW,
        createdAt: "2025-09-05T14:30:00Z"
    },
    {
        id: "PROP003",
        title: "Advanced Coal Gasification Process",
        principalInvestigator: "Dr. Amit Patel",
        organization: "NEIST",
        currentStage: "Project Ongoing",
        status: PROPOSAL_STATUS.PROJECT_ONGOING,
        createdAt: "2025-08-20T09:00:00Z"
    },
    {
        id: "PROP004",
        title: "Digital Twin for Mining Operations",
        principalInvestigator: "Dr. Sunita Mehta",
        organization: "NIT Rourkela",
        currentStage: "SSRC Review",
        status: PROPOSAL_STATUS.SSRC_REVIEW,
        createdAt: "2025-09-10T11:45:00Z"
    },
    {
        id: "PROP005",
        title: "Carbon Capture Technology Research",
        principalInvestigator: "Dr. Vikram Singh",
        organization: "IIT Kharagpur",
        currentStage: "Draft",
        status: PROPOSAL_STATUS.DRAFT,
        createdAt: "2025-09-15T16:20:00Z"
    }
];

export default function ProposalsSection() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProposals = PROPOSALS_DATA.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Projects & Proposals</h2>
                    <p className="text-slate-500 text-sm mt-1">Track and manage all research proposals and ongoing projects.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
                    <FileText size={18} />
                    <span>New Proposal</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Proposals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProposals.map((proposal) => {
                    const statusConfig = STATUS_CONFIG[proposal.status] || { label: proposal.status, className: 'bg-slate-100 text-slate-600' };
                    return (
                        <div key={proposal.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 h-12">{proposal.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mb-4">{proposal.organization}</p>

                            <div className="flex items-center gap-2 mb-6">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusConfig.className}`}>
                                    {statusConfig.label}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">• {formatDate(proposal.createdAt)}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">PI</div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-400">+2</div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Eye size={18} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                        <TrendingUp size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
