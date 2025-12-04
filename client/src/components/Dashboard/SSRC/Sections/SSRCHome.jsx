'use client';

import { useState, useEffect } from "react";
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle,
    Rocket,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import apiClient from "../../../../utils/api";

// Counter animation component
const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let startTime;
        let animationFrame;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(targetValue * easeOutQuart));
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animationFrame = requestAnimationFrame(animate);
        
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [targetValue, duration]);
    
    return <span>{count}</span>;
};

export default function SSRCHome({ theme }) {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-600';

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/proposals');
            const proposalData = response.data?.data?.proposals || response.data?.proposals || [];
            setProposals(Array.isArray(proposalData) ? proposalData : []);
        } catch (error) {
            console.error("Error fetching proposals:", error);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const stats = {
        incoming: proposals.filter(p => p.status === 'TSSRC_ACCEPTED').length,
        underReview: proposals.filter(p => p.status === 'SSRC_REVIEW').length,
        approved: proposals.filter(p => p.status === 'SSRC_ACCEPTED').length,
        rejected: proposals.filter(p => p.status === 'SSRC_REJECTED').length
    };

    const statCards = [
        { 
            label: 'Incoming', 
            value: stats.incoming, 
            icon: FileText, 
            color: isDark ? 'text-cyan-400 bg-cyan-900/30' : 'text-cyan-600 bg-cyan-50',
            trend: '+15%',
            trendUp: true
        },
        { 
            label: 'Under Review', 
            value: stats.underReview, 
            icon: Clock, 
            color: isDark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-600 bg-amber-50',
            trend: '-3%',
            trendUp: false
        },
        { 
            label: 'Funded Projects', 
            value: stats.approved, 
            icon: Rocket, 
            color: isDark ? 'text-teal-400 bg-teal-900/30' : 'text-teal-600 bg-teal-50',
            trend: '+12%',
            trendUp: true
        },
        { 
            label: 'Rejected', 
            value: stats.rejected, 
            icon: XCircle, 
            color: isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50',
            trend: '-5%',
            trendUp: false
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className={`w-8 h-8 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h2 className={`text-2xl font-bold ${textColor}`}>SSRC Dashboard</h2>
                <p className={`${subTextColor} text-sm mt-1`}>Standing Scientific Research Committee - Final Review & Funding Approval Panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`${cardBg} p-5 rounded-xl shadow-sm border transition-all hover:shadow-md`}>
                            <div className="flex items-start justify-between">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>{stat.label}</p>
                                <p className={`text-3xl font-black ${textColor} mt-1`}>
                                    <AnimatedCounter targetValue={stat.value} duration={1500 + index * 200} />
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Info */}
            <div className={`${cardBg} p-6 rounded-xl shadow-sm border`}>
                <h3 className={`text-lg font-bold ${textColor} mb-4`}>Role Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                        <h4 className={`font-bold ${textColor} mb-2`}>Primary Responsibilities</h4>
                        <ul className={`text-sm ${subTextColor} space-y-1`}>
                            <li>• Final review of TSSRC-approved proposals</li>
                            <li>• Approve funding for research projects</li>
                            <li>• Monitor funded project progress</li>
                            <li>• Strategic research direction decisions</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl ${isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                        <h4 className={`font-bold ${textColor} mb-2`}>Decision Authority</h4>
                        <ul className={`text-sm ${subTextColor} space-y-1`}>
                            <li>1. Review TSSRC recommendations</li>
                            <li>2. Approve or reject for funding</li>
                            <li>3. Allocate S&T budget</li>
                            <li>4. Final authority on project approval</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Funding Highlight */}
            <div className={`${cardBg} p-6 rounded-xl shadow-sm border ${isDark ? 'border-teal-500/30' : 'border-teal-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                        <Rocket size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${textColor}`}>Funded Projects</h3>
                        <p className={`text-xs ${subTextColor}`}>Projects approved for S&T funding</p>
                    </div>
                </div>
                <p className={`text-sm ${subTextColor}`}>
                    Approved projects are allocated funding from the Ministry of Coal S&T budget. 
                    These projects contribute to technological advancement in the coal mining sector.
                </p>
            </div>
        </div>
    );
}
