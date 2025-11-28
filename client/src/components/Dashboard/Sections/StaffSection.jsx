'use client';

import {
    LayoutGrid,
    List,
    Mail,
    Phone,
    Search,
    UserPlus
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StaffDetail from "../Staff/StaffDetail";

const STAFF_DATA = [
    { id: 1, name: "Sarah Wilson", role: "Project Manager", department: "Operations", email: "sarah.w@example.com", phone: "+1 234 567 890", status: "Active" },
    { id: 2, name: "Mike Johnson", role: "Senior Developer", department: "Engineering", email: "mike.j@example.com", phone: "+1 234 567 891", status: "Active" },
    { id: 3, name: "Emily Davis", role: "UX Designer", department: "Design", email: "emily.d@example.com", phone: "+1 234 567 892", status: "On Leave" },
    { id: 4, name: "Robert Brown", role: "QA Engineer", department: "Engineering", email: "robert.b@example.com", phone: "+1 234 567 893", status: "Active" },
    { id: 5, name: "David Lee", role: "Product Owner", department: "Product", email: "david.l@example.com", phone: "+1 234 567 894", status: "Inactive" },
];

export default function StaffSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
    const [selectedStaff, setSelectedStaff] = useState(null);
    const router = useRouter();

    // Handle URL query param for staff ID
    useEffect(() => {
        if (router.query.staffId) {
            const staff = STAFF_DATA.find(s => s.id === parseInt(router.query.staffId));
            if (staff) setSelectedStaff(staff);
        } else {
            setSelectedStaff(null);
        }
    }, [router.query.staffId]);

    const handleStaffClick = (staff) => {
        setSelectedStaff(staff);
        // Shallow routing
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, staffId: staff.id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedStaff(null);
        const { staffId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const filteredStaff = STAFF_DATA.filter(staff =>
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50';

    if (selectedStaff) {
        return <StaffDetail staff={selectedStaff} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor}`}>Staff Directory</h2>
                    <p className={`${subTextColor} text-sm mt-1`}>Contact information for all staff members.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
                    <UserPlus size={18} />
                    <span>Add Staff</span>
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
                        placeholder="Search staff..."
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
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Name</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Role</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Department</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Email</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Status</th>
                                    <th className={`p-6 text-xs font-bold uppercase tracking-wider ${subTextColor} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkest ? 'divide-neutral-800' : isDark ? 'divide-slate-700' : 'divide-slate-50'}`}>
                                {filteredStaff.map((staff) => (
                                    <tr
                                        key={staff.id}
                                        onClick={() => handleStaffClick(staff)}
                                        className={`group transition-colors cursor-pointer ${hoverBg}`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${textColor}`}>{staff.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{staff.role}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{staff.department}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{staff.email}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${staff.status === 'Active'
                                                ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                                : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                                {staff.status}
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
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((staff) => (
                        <div
                            key={staff.id}
                            onClick={() => handleStaffClick(staff)}
                            className={`${cardBg} p-6 rounded-3xl shadow-sm border flex flex-col items-center text-center transition-all cursor-pointer hover:shadow-md ${hoverBg}`}
                        >
                            <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center text-3xl font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                {staff.name.charAt(0)}
                            </div>
                            <h3 className={`font-bold text-lg ${textColor}`}>{staff.name}</h3>
                            <p className="text-blue-600 font-medium text-sm mb-1">{staff.role}</p>
                            <p className={`${subTextColor} text-xs font-bold uppercase tracking-wider mb-4`}>{staff.department}</p>

                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-6 ${staff.status === 'Active'
                                ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                {staff.status}
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
    );
}
