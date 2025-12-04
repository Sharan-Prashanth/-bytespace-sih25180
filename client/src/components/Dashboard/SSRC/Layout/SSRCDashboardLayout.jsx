'use client';

import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    ChevronRight,
    LogOut,
    Moon,
    Sun,
    Shield,
    Menu,
    X,
    HelpCircle
} from "lucide-react";
import { Toast, useToast } from "../../../ui (plate files)/toast";

const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'proposals', label: 'Proposals', icon: FileText },
];

export default function SSRCDashboardLayout({ 
    children, 
    activeSection, 
    setActiveSection, 
    theme = 'light',
    toggleTheme
}) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { toasts, addToast, removeToast, info } = useToast();

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    // Theme classes
    const sidebarBg = isDarkest ? 'bg-neutral-950' : isDark ? 'bg-slate-900' : 'bg-white';
    const sidebarBorder = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-800' : 'border-slate-200';
    const mainBg = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-slate-50';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const hoverBg = isDarkest ? 'hover:bg-neutral-800' : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
    const activeBg = isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-800' : 'bg-slate-100';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleHelpClick = () => {
        info('Help & Information will be implemented soon.');
    };

    return (
        <div className={`min-h-screen flex ${mainBg}`}>
            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            )}

            {/* Sidebar - Desktop */}
            <aside className={`hidden md:flex w-64 flex-col fixed h-screen ${sidebarBg} border-r ${sidebarBorder} z-30`}>
                {/* Logo / Header */}
                <div className={`p-6 border-b ${sidebarBorder}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className={`font-bold ${textColor}`}>SSRC Panel</h1>
                            <p className={`text-xs ${subTextColor}`}>Final Review</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    isActive 
                                        ? `${activeBg} ${isDark ? 'text-teal-400' : 'text-teal-600'}` 
                                        : `${subTextColor} ${hoverBg}`
                                }`}
                            >
                                <Icon size={18} />
                                <span>{section.label}</span>
                                {isActive && <ChevronRight size={16} className="ml-auto" />}
                            </button>
                        );
                    })}
                </nav>

                {/* User / Footer */}
                <div className={`p-4 border-t ${sidebarBorder}`}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${subTextColor} ${hoverBg} mb-2`}
                    >
                        {theme === 'light' ? (
                            <Moon size={18} />
                        ) : theme === 'dark' ? (
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                            </svg>
                        ) : (
                            <Sun size={18} />
                        )}
                        <span>{theme === 'light' ? 'Dark Mode' : theme === 'dark' ? 'Darkest Mode' : 'Light Mode'}</span>
                    </button>

                    {/* Help Button */}
                    <button
                        onClick={handleHelpClick}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${subTextColor} ${hoverBg} mb-2`}
                    >
                        <HelpCircle size={18} />
                        <span>Help & Information</span>
                    </button>
                    
                    {/* User Info */}
                    <div className={`p-3 rounded-xl ${isDarkest ? 'bg-neutral-800' : isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                                {user?.fullName?.charAt(0) || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${textColor}`}>{user?.fullName || 'SSRC Member'}</p>
                                <p className={`text-xs truncate ${subTextColor}`}>{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-red-500 ${hoverBg} mt-2`}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className={`md:hidden fixed top-0 left-0 right-0 ${sidebarBg} border-b ${sidebarBorder} z-40 px-4 py-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                            <Shield size={16} />
                        </div>
                        <span className={`font-bold ${textColor}`}>SSRC Panel</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-lg ${hoverBg}`}
                    >
                        {isMobileMenuOpen ? <X size={20} className={textColor} /> : <Menu size={20} className={textColor} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className={`md:hidden fixed inset-0 ${sidebarBg} z-30 pt-16`}>
                    <nav className="p-4 space-y-1">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setActiveSection(section.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                            ? `${activeBg} ${isDark ? 'text-teal-400' : 'text-teal-600'}` 
                                            : `${subTextColor} ${hoverBg}`
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{section.label}</span>
                                </button>
                            );
                        })}
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${subTextColor} ${hoverBg}`}
                        >
                            {theme === 'light' ? (
                                <Moon size={18} />
                            ) : theme === 'dark' ? (
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                                </svg>
                            ) : (
                                <Sun size={18} />
                            )}
                            <span>{theme === 'light' ? 'Dark Mode' : theme === 'dark' ? 'Darkest Mode' : 'Light Mode'}</span>
                        </button>
                        <button
                            onClick={() => {
                                handleHelpClick();
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${subTextColor} ${hoverBg}`}
                        >
                            <HelpCircle size={18} />
                            <span>Help & Information</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-red-500 ${hoverBg}`}
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 pt-16 md:pt-0">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
