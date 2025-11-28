'use client';

import {
    Calendar,
    Folder,
    LayoutGrid,
    List,
    MapPin,
    MoreHorizontal,
    Search,
    Users
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { PROJECTS_DATA } from "../../../../utils/cmpdiMock/projects";

export default function ProjectsSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const router = useRouter();

    const handleProjectClick = (project) => {
        // Shallow routing for detail view
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, projectId: project.id }
        }, undefined, { shallow: true });
    };

    const filteredProjects = PROJECTS_DATA.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lead.toLowerCase().includes(searchTerm.toLowerCase())
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
            case 'Active': return isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Completed': return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100';
            case 'On Hold': return isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100';
            default: return isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Active Projects</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Monitor progress and status of ongoing implementations.</p>
                </div>
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
                        placeholder="Search projects..."
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
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Project Name</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Site / Location</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Lead</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Progress</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Start Date</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {filteredProjects.map((project) => (
                                    <tr
                                        key={project.id}
                                        onClick={() => handleProjectClick(project)}
                                        className={`group transition-colors cursor-pointer ${hoverBg}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                                    <Folder size={20} />
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${textColor} line-clamp-1`}>{project.title}</div>
                                                    <div className={`text-xs ${subTextColor}`}>{project.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className={subTextColor} />
                                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{project.site}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                    {project.lead.charAt(0)}
                                                </div>
                                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{project.lead}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="w-full max-w-[100px]">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={subTextColor}>{project.progress}%</span>
                                                </div>
                                                <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                    <div
                                                        className={`h-full rounded-full ${project.progress === 100 ? 'bg-blue-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className={`text-sm font-medium ${subTextColor}`}>{project.startDate}</span>
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
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => handleProjectClick(project)}
                            className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                    <Folder size={24} />
                                </div>
                                <button className={`p-1 rounded-lg hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'text-slate-400'}`}>
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <h3 className={`font-bold text-lg mb-2 line-clamp-2 h-14 ${textColor}`}>{project.title}</h3>

                            <div className="flex items-center gap-4 mb-6 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className={subTextColor} />
                                    <span className={subTextColor}>{project.site}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users size={14} className={subTextColor} />
                                    <span className={subTextColor}>{project.teamSize} Members</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className={`font-medium ${textColor}`}>Progress</span>
                                    <span className={`font-bold ${textColor}`}>{project.progress}%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                    <div
                                        className={`h-full rounded-full ${project.progress === 100 ? 'bg-blue-500' : 'bg-blue-600'}`}
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between pt-4 border-t mt-auto ${borderColor}`}>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className={subTextColor} />
                                    <span className={`text-xs font-medium ${subTextColor}`}>{project.startDate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
