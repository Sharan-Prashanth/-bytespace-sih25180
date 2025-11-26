'use client';

import {
    Briefcase,
    DollarSign,
    HelpCircle,
    Home,
    LogOut,
    Shield,
    Users
} from 'lucide-react';
import { useRouter } from 'next/router';

const MENU_ITEMS = [
    { id: 'overview', label: 'Home', icon: Home, path: '/admin', section: 'overview' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users', section: 'users' },
    { id: 'staff', label: 'Staff', icon: Users, path: '/admin/staff', section: 'staff' },
    { id: 'proposals', label: 'Proposals', icon: Briefcase, path: '/admin/proposals', section: 'proposals' },
    { id: 'finance', label: 'Finance', icon: DollarSign, path: '/admin/finance', section: 'finance' },
    { id: 'roles', label: 'Roles', icon: Shield, path: '/admin/roles', section: 'roles' },
];

export default function Sidebar({ activeSection, setActiveSection, onLogout }) {
    const router = useRouter();

    const handleNavigation = (item) => {
        if (setActiveSection) {
            setActiveSection(item.section);
        }
        // In a real app, you might want to push to router if paths differ
        // router.push(item.path);
    };

    return (
        <div className="w-64 h-full bg-white flex flex-col border-r border-slate-100 py-8 px-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">PRISM</span>
            </div>

            {/* Menu Items */}
            <div className="flex-1 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeSection === item.section;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item)}
                            className={`
                                w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
                                ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}
                                />
                                <span>{item.label}</span>
                            </div>
                            {item.badge && (
                                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs text-slate-600 font-bold group-hover:bg-slate-200">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1">
                <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-50">
                    <HelpCircle size={20} />
                    <span className="text-sm font-medium">Help & information</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Log out</span>
                </button>
            </div>
        </div>
    );
}
