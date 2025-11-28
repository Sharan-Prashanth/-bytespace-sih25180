import {
    ArrowLeft,
    Calendar,
    LayoutGrid,
    List,
    Mail,
    Phone,
    Shield,
    Users
} from 'lucide-react';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StaffDetail from "../Staff/StaffDetail";

// Mock Data for Members in Roles
const ROLE_MEMBERS_DATA = {
    1: [ // Admin
        { id: 101, name: "Alice Admin", role: "Admin", department: "IT", email: "alice@example.com", phone: "+1 111 222 333", status: "Active", joinedAt: "Jan 10, 2023" },
        { id: 102, name: "Bob System", role: "Admin", department: "Operations", email: "bob@example.com", phone: "+1 111 222 334", status: "Active", joinedAt: "Feb 15, 2023" },
    ],
    2: [ // Manager
        { id: 201, name: "Charlie Manager", role: "Manager", department: "Sales", email: "charlie@example.com", phone: "+1 222 333 444", status: "Active", joinedAt: "Mar 20, 2023" },
        { id: 202, name: "David Lead", role: "Manager", department: "Marketing", email: "david@example.com", phone: "+1 222 333 445", status: "On Leave", joinedAt: "Apr 05, 2023" },
    ],
    3: [ // Reviewer
        { id: 301, name: "Eve Reviewer", role: "Reviewer", department: "Quality", email: "eve@example.com", phone: "+1 333 444 555", status: "Active", joinedAt: "May 12, 2023" },
    ],
    4: [ // Editor
        { id: 401, name: "Frank Editor", role: "Editor", department: "Content", email: "frank@example.com", phone: "+1 444 555 666", status: "Inactive", joinedAt: "Jun 18, 2023" },
    ],
    5: [ // Viewer
        { id: 501, name: "Grace Viewer", role: "Viewer", department: "Audit", email: "grace@example.com", phone: "+1 555 666 777", status: "Active", joinedAt: "Jul 22, 2023" },
    ]
};

export default function RoleDetail({ role, onBack, theme }) {
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [selectedStaff, setSelectedStaff] = useState(null);
    const router = useRouter();

    const members = ROLE_MEMBERS_DATA[role.id] || [];

    // Handle URL query param for staff ID
    useEffect(() => {
        if (router.query.staffId) {
            const staff = members.find(s => s.id === parseInt(router.query.staffId));
            if (staff) setSelectedStaff(staff);
        } else {
            setSelectedStaff(null);
        }
    }, [router.query.staffId, members]);

    const handleStaffClick = (staff) => {
        setSelectedStaff(staff);
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, staffId: staff.id }
        }, undefined, { shallow: true });
    };

    const handleStaffBack = () => {
        setSelectedStaff(null);
        const { staffId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-950 border-neutral-900' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-900' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-900' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';

    if (selectedStaff) {
        return <StaffDetail staff={selectedStaff} onBack={handleStaffBack} theme={theme} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>{role.name}</h2>
                    <p className={`text-sm ${subTextColor}`}>Role Details & Members</p>
                </div>
            </div>

            {/* Role Info Card */}
            <div className={`p-6 rounded-3xl shadow-sm border ${cardBg}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${textColor}`}>{role.name}</h3>
                                <p className={`text-sm ${subTextColor}`}>{role.permission} Permissions</p>
                            </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {role.description}
                        </p>
                    </div>

                    <div className={`flex items-center gap-8 px-6 py-4 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextColor}`}>Total Members</p>
                            <div className="flex items-center gap-2">
                                <Users size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                <span className={`text-2xl font-bold ${textColor}`}>{role.totalMembers}</span>
                            </div>
                        </div>
                        <div className={`w-px h-12 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subTextColor}`}>Last Updated</p>
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                <span className={`text-sm font-bold ${textColor}`}>{role.updatedAt}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${textColor}`}>Members in this Role</h3>

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

                {viewMode === 'table' ? (
                    // Members Table
                    <div className={`${cardBg} rounded-3xl shadow-sm border overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b ${borderColor}`}>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Name</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Department</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Email</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Joined Date</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                        <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                    {members.map((member) => (
                                        <tr
                                            key={member.id}
                                            onClick={() => handleStaffClick(member)}
                                            className={`group transition-colors cursor-pointer ${hoverBg}`}
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold ${textColor}`}>{member.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.department}</span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.email}</span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.joinedAt}</span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${member.status === 'Active'
                                                    ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                                    : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <button className={`p-2 rounded-lg ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                                        <Mail size={16} />
                                                    </button>
                                                    <button className={`p-2 rounded-lg ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                                        <Phone size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Members Cards
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                onClick={() => handleStaffClick(member)}
                                className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col items-center text-center transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                            >
                                <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center text-3xl font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {member.name.charAt(0)}
                                </div>
                                <h3 className={`font-bold text-lg ${textColor}`}>{member.name}</h3>
                                <p className="text-blue-600 font-medium text-sm mb-1">{member.role}</p>
                                <p className={`${subTextColor} text-xs font-bold uppercase tracking-wider mb-4`}>{member.department}</p>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-6 ${member.status === 'Active'
                                    ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                    : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                    {member.status}
                                </span>

                                <div className="flex items-center gap-3 w-full mt-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className={`flex-1 py-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-colors
                                        ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Mail size={16} /> Email
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className={`flex-1 py-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-colors
                                        ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Phone size={16} /> Call
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
