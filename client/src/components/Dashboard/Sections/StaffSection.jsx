'use client';

import {
    Mail,
    Phone,
    Search,
    User
} from "lucide-react";
import { useState } from "react";

const STAFF_DATA = [
    { id: 1, name: "Sarah Wilson", role: "Project Manager", department: "Operations", email: "sarah.w@example.com", phone: "+1 234 567 890" },
    { id: 2, name: "Mike Johnson", role: "Senior Developer", department: "Engineering", email: "mike.j@example.com", phone: "+1 234 567 891" },
    { id: 3, name: "Emily Davis", role: "UX Designer", department: "Design", email: "emily.d@example.com", phone: "+1 234 567 892" },
    { id: 4, name: "Robert Brown", role: "QA Engineer", department: "Engineering", email: "robert.b@example.com", phone: "+1 234 567 893" },
];

export default function StaffSection() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Staff Directory</h2>
                    <p className="text-slate-500 text-sm mt-1">Contact information for all staff members.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STAFF_DATA.map((staff) => (
                    <div key={staff.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all">
                        <div className="w-20 h-20 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-slate-400">
                            <User size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">{staff.name}</h3>
                        <p className="text-blue-600 font-medium text-sm mb-1">{staff.role}</p>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">{staff.department}</p>

                        <div className="flex items-center gap-3 w-full">
                            <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                                <Mail size={16} /> Email
                            </button>
                            <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                                <Phone size={16} /> Call
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
