'use client';

import { Calendar, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import CalendarWidget from '../../Widgets/CalendarWidget';
import CMPDISidebar from './CMPDISidebar';

export default function CMPDIDashboardLayout({
    children,
    activeSection,
    setActiveSection,
    user,
    logout,
    theme,
    toggleTheme
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format date as "16 May, 2023"
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const isDark = theme === 'dark' || theme === 'darkest';

    return (
        <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300
            ${theme === 'darkest' ? 'bg-black text-slate-100' : theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'}
        `}>
            {/* Left Sidebar */}
            <CMPDISidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onLogout={logout}
                theme={theme}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Header */}
                <header className="px-8 py-6 flex items-start justify-between bg-transparent shrink-0 relative z-20">
                    <div>
                        {activeSection === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome, {user?.fullName || 'CMPDI Admin'}</h1>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track projects and manage resources</p>
                            </div>
                        )}
                    </div>
                    <div className={`flex items-center gap-3 font-medium text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>{formattedDate}</span>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-xl shadow-sm transition-colors 
                                ${theme === 'darkest' ? 'bg-neutral-900 text-white border border-neutral-800 hover:bg-neutral-800' :
                                    theme === 'dark' ? 'bg-slate-800 text-white hover:bg-slate-700' :
                                        'bg-white text-black hover:bg-slate-100'}
                            `}
                            title={theme === 'light' ? 'Switch to Dark Mode' : theme === 'dark' ? 'Switch to Darkest Mode' : 'Switch to Light Mode'}
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
                        </button>

                        {/* Calendar Widget Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className={`p-2 rounded-xl shadow-sm transition-all
                                    ${showCalendar
                                        ? 'bg-blue-600 text-white shadow-blue-500/30'
                                        : theme === 'darkest' ? 'bg-neutral-900 text-slate-200 border border-neutral-800 hover:bg-neutral-800' : theme === 'dark' ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-600 hover:text-slate-900'}
                                `}
                            >
                                <Calendar size={18} />
                            </button>

                            {showCalendar && (
                                <CalendarWidget onClose={() => setShowCalendar(false)} theme={theme} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Content - Scrollable based on section */}
                <main className={`flex-1 px-8 pb-8 flex flex-col transition-all duration-300
                    ${activeSection === 'overview' ? 'overflow-hidden' : 'overflow-y-auto h-full'}
                `}>
                    {children}
                </main>
            </div>
        </div>
    );
}
