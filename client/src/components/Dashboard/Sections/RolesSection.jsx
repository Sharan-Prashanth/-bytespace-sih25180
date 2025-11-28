'use client';

import {
    LayoutGrid,
    List,
    Search,
    Shield,
    Users
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import RoleDetail from "../Roles/RoleDetail";

// Mock Data
const ROLES_DATA = [
    { id: 1, name: "Admin", description: "Full access to all system features and settings.", totalMembers: 2, permission: "Full Access", updatedAt: "Oct 25, 2025" },
    { id: 2, name: "Manager", description: "Can manage projects, staff, and view reports.", totalMembers: 5, permission: "Elevated", updatedAt: "Oct 20, 2025" },
    { id: 3, name: "Reviewer", description: "Can review proposals and provide feedback.", totalMembers: 8, permission: "Basic", updatedAt: "Oct 15, 2025" },
    { id: 4, name: "Editor", description: "Can edit content and manage documentation.", totalMembers: 3, permission: "Basic", updatedAt: "Oct 10, 2025" },
    { id: 5, name: "Viewer", description: "Read-only access to public projects and reports.", totalMembers: 12, permission: "Read Only", updatedAt: "Oct 05, 2025" },
];

export default function RolesSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [selectedRole, setSelectedRole] = useState(null);
    const router = useRouter();

    // Handle URL query param for role ID
    useEffect(() => {
        if (router.query.roleId) {
            const role = ROLES_DATA.find(r => r.id === parseInt(router.query.roleId));
            if (role) setSelectedRole(role);
        } else {
            setSelectedRole(null);
        }
    }, [router.query.roleId]);

    const handleRoleClick = (role) => {
        setSelectedRole(role);
        // Shallow routing
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, roleId: role.id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedRole(null);
        const { roleId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const filteredRoles = ROLES_DATA.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';

    if (selectedRole) {
        return <RoleDetail role={selectedRole} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Roles & Permissions</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Manage user roles and access levels.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 font-bold text-sm">
                    <Shield size={18} />
                    <span>Create Role</span>
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
                        placeholder="Search roles..."
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
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Role Name</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Description</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Permission Level</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Total Members</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {filteredRoles.map((role) => (
                                    <tr
                                        key={role.id}
                                        onClick={() => handleRoleClick(role)}
                                        className={`group transition-colors cursor-pointer ${hoverBg}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    <Shield size={20} />
                                                </div>
                                                <div className={`font-bold ${textColor}`}>{role.name}</div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{role.description}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                                                ${role.permission === 'Full Access'
                                                    ? (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                                                    : role.permission === 'Elevated'
                                                        ? (isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100')
                                                        : (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100')
                                                }
                                            `}>
                                                {role.permission}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className={subTextColor} />
                                                <span className={`text-sm font-bold ${textColor}`}>{role.totalMembers}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className={`text-sm font-medium ${subTextColor}`}>{role.updatedAt}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRoles.map((role) => (
                        <div
                            key={role.id}
                            onClick={() => handleRoleClick(role)}
                            className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <Shield size={24} />
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                                    ${role.permission === 'Full Access'
                                        ? (isDark ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100')
                                        : role.permission === 'Elevated'
                                            ? (isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100')
                                            : (isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100')
                                    }
                                `}>
                                    {role.permission}
                                </span>
                            </div>

                            <h3 className={`font-bold text-lg mb-2 ${textColor}`}>{role.name}</h3>
                            <p className={`text-sm mb-6 line-clamp-2 ${subTextColor}`}>{role.description}</p>

                            <div className={`flex items-center justify-between pt-4 border-t mt-auto ${borderColor}`}>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className={subTextColor} />
                                    <span className={`text-sm font-bold ${textColor}`}>{role.totalMembers} Members</span>
                                </div>
                                <span className={`text-xs font-medium ${subTextColor}`}>{role.updatedAt}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
