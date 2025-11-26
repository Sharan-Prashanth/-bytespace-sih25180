'use client';

import {
    Edit,
    Search,
    Trash2,
    UserPlus
} from "lucide-react";
import { useState } from "react";

// Mock Data
const USERS_DATA = [
    { id: 1, name: "Dr. Rajesh Kumar", email: "rajesh.kumar@iitd.ac.in", role: "Investigator", org: "IIT Delhi", status: "Active" },
    { id: 2, name: "Dr. Priya Sharma", email: "priya.sharma@cimfr.org", role: "Investigator", org: "CSIR-CIMFR", status: "Active" },
    { id: 3, name: "Dr. Amit Verma", email: "amit.verma@expert.gov.in", role: "Expert", org: "Ministry of Coal", status: "Active" },
    { id: 4, name: "Mr. Suresh Patil", email: "suresh.patil@cmpdi.gov.in", role: "CMPDI", org: "CMPDI", status: "Active" },
    { id: 5, name: "Dr. Anjali Desai", email: "anjali.desai@inactive.org", role: "Investigator", org: "Regional Institute", status: "Inactive" },
];

export default function UsersSection() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = USERS_DATA.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your team members and their account permissions here.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm">
                    <UserPlus size={18} />
                    <span>Add Member</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                        Filters
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Email address</th>
                                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Organization</th>
                                <th className="p-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-500">@{user.name.split(' ')[0].toLowerCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-medium text-slate-600">{user.role}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-medium text-slate-600">{user.email}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-medium text-slate-600">{user.org}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
                <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Previous</button>
                    <div className="text-sm font-medium text-slate-500">Page 1 of 10</div>
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Next</button>
                </div>
            </div>
        </div>
    );
}
