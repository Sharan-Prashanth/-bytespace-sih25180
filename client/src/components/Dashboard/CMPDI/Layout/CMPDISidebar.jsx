'use client';

import {
    AlertTriangle,
    Briefcase,
    DollarSign,
    Folder,
    HelpCircle,
    Home,
    LogOut,
    Map,
    UserCheck,
    Info,
    X
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const MENU_ITEMS = [
    { id: 'overview', label: 'Home', icon: Home, section: 'overview' },
    { id: 'projects', label: 'Projects', icon: Folder, section: 'projects' },
    { id: 'proposals', label: 'Proposals', icon: Briefcase, section: 'proposals' },
    { id: 'experts', label: 'Experts', icon: UserCheck, section: 'experts' },
    { id: 'finance', label: 'Finance', icon: DollarSign, section: 'finance' },
    { id: 'safety', label: 'Safety', icon: AlertTriangle, section: 'safety' },
    { id: 'gis', label: 'GIS Map', icon: Map, section: 'gis' },
];

// Toast Component
function Toast({ message, onClose, theme }) {
    const isDark = theme === 'dark' || theme === 'darkest';
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-black'}`}>
                <Info size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <span className="text-sm font-medium">{message}</span>
                <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                    <X size={16} className={isDark ? 'text-slate-400' : 'text-black'} />
                </button>
            </div>
        </div>
    );
}

export default function CMPDISidebar({ activeSection, setActiveSection, onLogout, theme }) {
    const router = useRouter();
    const [showToast, setShowToast] = useState(false);

    const handleNavigation = (item) => {
        if (setActiveSection) {
            setActiveSection(item.section);
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
                <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>CMPDI</span>
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
                <button 
                    onClick={() => setShowToast(true)}
                    className={`w-full flex items-center gap-3 p-3 transition-colors rounded-xl
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
            
            {showToast && (
                <Toast 
                    message="Help & Information coming soon" 
                    onClose={() => setShowToast(false)} 
                    theme={theme} 
                />
            )}
        </div>
    );
}
