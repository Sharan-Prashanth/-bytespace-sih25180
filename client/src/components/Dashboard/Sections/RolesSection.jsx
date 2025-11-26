'use client';

import {
    Check,
    Shield
} from "lucide-react";

const ROLES = [
    { name: "Administrator", users: 3, permissions: ["All Access"] },
    { name: "Investigator", users: 12, permissions: ["Submit Proposals", "View Own Projects"] },
    { name: "Expert Reviewer", users: 8, permissions: ["Review Proposals", "Add Comments"] },
    { name: "CMPDI Official", users: 5, permissions: ["Approve/Reject", "Manage Grants"] },
];

export default function RolesSection() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Roles & Permissions</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage system roles and access levels.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ROLES.map((role) => (
                    <div key={role.name} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Shield size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                                <p className="text-slate-500 text-sm">{role.users} Users</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permissions</p>
                            {role.permissions.map((perm) => (
                                <div key={perm} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                    <Check size={16} className="text-emerald-500" />
                                    {perm}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
