'use client';

import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import RightSidebar from '../Sidebar/RightSidebar';
import Sidebar from '../Sidebar/Sidebar';

export default function DashboardLayout({ children, activeSection, setActiveSection, user, logout }) {
    const [isMobile, setIsMobile] = useState(false);

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

    return (
        <div className="flex h-screen bg-[#f3f4f6] font-sans text-slate-900 overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onLogout={logout}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Header */}
                <header className="px-8 py-8 flex items-start justify-between bg-[#f3f4f6]">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, Admin</h1>
                        <p className="text-slate-500 mt-2">Track proposals and manage your team</p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                        <span>{formattedDate}</span>
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Calendar size={18} />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
                    {children}
                </main>
            </div>
        </div>
    );
}
