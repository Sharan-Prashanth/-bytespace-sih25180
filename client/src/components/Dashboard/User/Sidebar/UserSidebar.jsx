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

export default function UserSidebar({ activeSection, setActiveSection, onLogout, theme, showToast }) {
    const router = useRouter();

    const handleNavigation = (item) => {
        if (setActiveSection) {
            setActiveSection(item.section);
        } else {
            router.push(`/dashboard?section=${item.section}`);
        }
    };

    const handleHelpClick = () => {
        if (showToast) {
            showToast('Help & Information will be available soon.');
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
        <div className={`w-56 h-full flex flex-col border-r py-4 px-4 transition-colors duration-300 ${getContainerClass()}`}>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6 px-1">
                <img src="/images/prism brand logo.png" alt="PRISM" className="w-7 h-7 object-contain" />
                <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PRISM</span>
            </div>

            {/* Menu Items */}
            <div className="flex-1 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeSection === item.section;

                    let itemClass = '';
                    if (isActive) {
                        if (isDarkest) itemClass = 'text-white bg-neutral-900';
                        else if (isDark) itemClass = 'text-white bg-slate-800';
                        else itemClass = 'text-black font-semibold';
                    } else {
                        if (isDarkest) itemClass = 'text-neutral-400 hover:bg-neutral-900 hover:text-white';
                        else if (isDark) itemClass = 'text-slate-400 hover:bg-slate-800 hover:text-white';
                        else itemClass = 'text-black hover:bg-slate-50 hover:text-black';
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item)}
                            className={`
                                w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 group text-sm
                                ${itemClass}
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <item.icon
                                    size={16}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={isActive ? (isDark ? 'text-blue-400' : 'text-black') : (isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-black group-hover:text-black')}
                                />
                                <span>{item.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1">
                <button 
                    onClick={handleHelpClick}
                    className={`w-full flex items-center gap-2 p-2 transition-colors rounded-lg text-xs
                    ${isDarkest ? 'text-neutral-400 hover:text-white hover:bg-neutral-900' :
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' :
                            'text-black hover:text-black hover:bg-slate-50'}
                `}>
                    <HelpCircle size={16} />
                    <span className="font-medium">Help & information</span>
                </button>
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-2 p-2 transition-colors rounded-lg text-xs
                        ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20' : 'text-black hover:text-red-600 hover:bg-red-50'}
                    `}
                >
                    <LogOut size={16} />
                    <span className="font-medium">Log out</span>
                </button>
            </div>
        </div>
    );
}
