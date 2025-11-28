'use client';

import {
    Briefcase,
    HelpCircle,
    Home,
    LogOut,
    Settings,
    User
} from 'lucide-react';
import { useRouter } from 'next/router';

const MENU_ITEMS = [
    { id: 'overview', label: 'Home', icon: Home, section: 'overview' },
    { id: 'proposals', label: 'Proposals', icon: Briefcase, section: 'proposals' },
    { id: 'profile', label: 'Profile', icon: User, section: 'profile' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'settings' },
];

export default function UserSidebar({ activeSection, setActiveSection, onLogout, theme }) {
    const router = useRouter();

    const handleNavigation = (item) => {
        if (setActiveSection) {
            setActiveSection(item.section);
        } else {
            router.push(`/dashboard?section=${item.section}`);
        }
    };

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const getContainerClass = () => {
        if (isDarkest) return 'bg-black border-neutral-900';
        if (isDark) return 'bg-slate-900 border-slate-800';
        return 'bg-white border-slate-100';
    };

    return (
        <div className={`w-64 h-full flex flex-col border-r py-8 px-6 transition-colors duration-300 ${getContainerClass()}`}>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12 px-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600' : 'bg-slate-900'}`}>
                    <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PRISM</span>
            </div>

            {/* Menu Items */}
            <div className="flex-1 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeSection === item.section;

                    let itemClass = '';
                    if (isActive) {
                        if (isDarkest) itemClass = 'text-white bg-neutral-900';
                        else if (isDark) itemClass = 'text-white bg-slate-800';
                        else itemClass = 'text-slate-900 font-semibold';
                    } else {
                        if (isDarkest) itemClass = 'text-neutral-400 hover:bg-neutral-900 hover:text-white';
                        else if (isDark) itemClass = 'text-slate-400 hover:bg-slate-800 hover:text-white';
                        else itemClass = 'text-slate-500 hover:bg-slate-50 hover:text-slate-900';
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item)}
                            className={`
                                w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
                                ${itemClass}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? (isDark ? 'text-blue-400' : 'text-slate-900') : (isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}
                                />
                                <span>{item.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1">
                <button className={`w-full flex items-center gap-3 p-3 transition-colors rounded-xl
                    ${isDarkest ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' :
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' :
                            'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                `}>
                    <HelpCircle size={20} />
                    <span className="text-sm font-medium">Help & information</span>
                </button>
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 p-3 transition-colors rounded-xl
                        ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}
                    `}
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Log out</span>
                </button>
            </div>
        </div>
    );
}
