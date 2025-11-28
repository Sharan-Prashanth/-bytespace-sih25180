'use client';

import { Calendar, ChevronRight, ChevronsLeft, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import CalendarWidget from '../Widgets/CalendarWidget';


export default function DashboardLayout({
    children,
    activeSection,
    setActiveSection,
    user,
    logout,
    theme,
    toggleTheme,
    sidebarControlProps // { metrics, selectedMetrics, onMetricSelect, onValueChange, onMonthChange }
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset collapse when switching sections
    useEffect(() => {
        if (activeSection !== 'overview') {
            setIsSidebarCollapsed(false);
        }
    }, [activeSection]);

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
            {/* Left Sidebar Area */}
            <div className={`shrink-0 transition-all duration-500 ease-in-out flex flex-col relative
                ${isSidebarCollapsed ? 'w-64 h-[50vh]' : 'w-64 h-full'}
            `}>
                {/* Top-Right Toggle Icon (Only for Overview) */}
                {activeSection === 'overview' && (
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`absolute top-4 right-3 z-50 p-1.5 rounded-full shadow-sm border transition-all
                            ${theme === 'darkest' ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white' :
                                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' :
                                    'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}
                        `}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronsLeft size={14} />}
                    </button>
                )}

                {/* Sidebar Component handles its own internal layout based on collapsed state */}
                <div className="h-full w-full">
                    <Sidebar
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        onLogout={logout}
                        theme={theme}
                        onCollapse={() => setIsSidebarCollapsed(true)}
                        isCollapsible={false} // Hide bottom collapse button since we have top icon
                        collapsed={isSidebarCollapsed}
                        sidebarControlProps={activeSection === 'overview' ? sidebarControlProps : null}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Header */}
                <header className="px-8 py-6 flex items-start justify-between bg-transparent shrink-0 relative z-20">
                    <div>
                        {activeSection === 'overview' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome, Admin</h1>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track proposals and manage your team</p>
                            </div>
                        )}
                    </div>
                    <div className={`flex items-center gap-3 font-medium text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>{formattedDate}</span>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-xl shadow-sm transition-colors 
                                ${theme === 'darkest' ? 'bg-neutral-900 text-yellow-400 border border-neutral-800 hover:bg-neutral-800' :
                                    theme === 'dark' ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' :
                                        'bg-white text-slate-600 hover:text-slate-900'}
                            `}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
