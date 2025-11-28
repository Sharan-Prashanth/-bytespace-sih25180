'use client';

import {
    Edit,
    Search,
    Trash2,
    UserPlus
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import UserDetail from "../Users/UserDetail";

// Mock Data
const USERS_DATA = [
    { id: 1, name: "Dr. Rajesh Kumar", email: "rajesh.kumar@iitd.ac.in", role: "Investigator", org: "IIT Delhi", status: "Active" },
    { id: 2, name: "Dr. Priya Sharma", email: "priya.sharma@cimfr.org", role: "Investigator", org: "CSIR-CIMFR", status: "Active" },
    { id: 3, name: "Dr. Amit Verma", email: "amit.verma@expert.gov.in", role: "Expert", org: "Ministry of Coal", status: "Active" },
    { id: 4, name: "Mr. Suresh Patil", email: "suresh.patil@cmpdi.gov.in", role: "CMPDI", org: "CMPDI", status: "Active" },
    { id: 5, name: "Dr. Anjali Desai", email: "anjali.desai@inactive.org", role: "Investigator", org: "Regional Institute", status: "Inactive" },
];

export default function UsersSection({ theme }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const router = useRouter();

    // Handle URL query param for user ID
    useEffect(() => {
        if (router.query.userId) {
            const user = USERS_DATA.find(u => u.id === parseInt(router.query.userId));
            if (user) setSelectedUser(user);
        } else {
            setSelectedUser(null);
        }
    }, [router.query.userId]);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        // Shallow routing to update URL without page reload
        const currentPath = router.pathname;
        router.push({
            pathname: currentPath,
            query: { ...router.query, userId: user.id }
        }, undefined, { shallow: true });
    };

    const handleBack = () => {
        setSelectedUser(null);
        // Remove userId from query
        const { userId, ...rest } = router.query;
        router.push({
            pathname: router.pathname,
            query: rest
        }, undefined, { shallow: true });
    };

    const filteredUsers = USERS_DATA.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedUser) {
        return <UserDetail user={selectedUser} onBack={handleBack} theme={theme} />;
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-slate-900'}`}>Team Members</h2>
                    <p className={`${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'} text-sm mt-1`}>Manage your team members and their account permissions here.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
                    <UserPlus size={18} />
                    <span>Add Member</span>
                </button>
            </div>

            {/* Filters */}
            <div className={`${theme === 'darkest' ? 'bg-neutral-900 border-neutral-800' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-4 rounded-2xl shadow-sm border flex items-center gap-4`}>
                <div className="relative flex-1 group">
    {/* Search Icon */}
    <Search
        size={18}
        className={`
            absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300
            ${theme === 'darkest'
                ? 'text-slate-500 group-focus-within:text-slate-300'
                : theme === 'dark'
                ? 'text-slate-400 group-focus-within:text-slate-200'
                : 'text-slate-400 group-focus-within:text-slate-600'}
        `}
    />

    {/* Input Box */}
    <input
        type="text"
        placeholder="Search team members..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`
            w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300
            text-sm font-medium border outline-none

            ${theme === 'darkest'
                ? 'bg-neutral-950 border-neutral-800 text-white placeholder-slate-600 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                : theme === 'dark'
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20'}
            
            shadow-sm hover:shadow-md
        `}
    />
</div>

                <div className="flex items-center gap-2">
                    <button className={`px-4 py-2 border rounded-xl text-sm font-bold transition-colors
                        ${theme === 'darkest' ? 'bg-neutral-900 border-neutral-800 text-slate-300 hover:bg-neutral-800' :
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' :
                                'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        Filters
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className={`${theme === 'darkest' ? 'bg-neutral-900 border-neutral-800' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-3xl shadow-sm border overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b ${theme === 'darkest' ? 'border-neutral-800' : theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Name</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Role</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Email address</th>
                                <th className={`p-6 text-xs font-bold uppercase tracking-wider ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Organization</th>
                                <th className="p-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'darkest' ? 'divide-neutral-800' : theme === 'dark' ? 'divide-slate-700' : 'divide-slate-50'}`}>
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() => handleUserClick(user)}
                                    className={`group transition-colors cursor-pointer
                                        ${theme === 'darkest' ? 'hover:bg-neutral-800' :
                                            theme === 'dark' ? 'hover:bg-slate-700/50' :
                                                'hover:bg-slate-50/50'}`}
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                                                ${theme === 'dark' || theme === 'darkest' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`font-bold ${theme === 'dark' || theme === 'darkest' ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
                                                <div className={`text-xs ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>@{user.name.split(' ')[0].toLowerCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.status === 'Active'
                                            ? (theme === 'dark' || theme === 'darkest' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                                            : (theme === 'dark' || theme === 'darkest' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-sm font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-slate-300' : 'text-slate-600'}`}>{user.role}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-sm font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-slate-300' : 'text-slate-600'}`}>{user.email}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-sm font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-slate-300' : 'text-slate-600'}`}>{user.org}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button className={`p-2 rounded-lg ${theme === 'dark' || theme === 'darkest' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={`p-2 rounded-lg ${theme === 'dark' || theme === 'darkest' ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={`p-6 border-t flex items-center justify-between ${theme === 'darkest' ? 'border-neutral-800' : theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button className={`px-4 py-2 border rounded-xl text-sm font-bold hover:bg-opacity-50 disabled:opacity-50
                        ${theme === 'darkest' ? 'border-neutral-800 text-slate-400 hover:bg-neutral-800' :
                            theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' :
                                'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Previous</button>
                    <div className={`text-sm font-medium ${theme === 'dark' || theme === 'darkest' ? 'text-slate-400' : 'text-slate-500'}`}>Page 1 of 10</div>
                    <button className={`px-4 py-2 border rounded-xl text-sm font-bold hover:bg-opacity-50
                        ${theme === 'darkest' ? 'border-neutral-800 text-slate-400 hover:bg-neutral-800' :
                            theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' :
                                'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Next</button>
                </div>
            </div>
        </div>
    );
}
