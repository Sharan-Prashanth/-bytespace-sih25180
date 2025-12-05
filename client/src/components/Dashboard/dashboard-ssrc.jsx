'use client';

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingScreen from "../../components/LoadingScreen";
import SSRCDashboardLayout from "./SSRC/Layout/SSRCDashboardLayout";
import SSRCHome from "./SSRC/Sections/SSRCHome";
import SSRCProposalsSection from "./SSRC/Sections/SSRCProposalsSection";

// Placeholder for sections not yet implemented
const PlaceholderSection = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>Module coming soon...</p>
    </div>
);

function SSRCDashboardContent() {
    const { user, loading } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'darkest';
            return 'light';
        });
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <SSRCHome theme={theme} />;
            case 'proposals':
                return <SSRCProposalsSection theme={theme} />;
            default:
                return <SSRCHome theme={theme} />;
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <SSRCDashboardLayout
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            theme={theme}
            toggleTheme={toggleTheme}
        >
            {renderSection()}
        </SSRCDashboardLayout>
    );
}

export default function SSRCDashboard() {
    return (
        <ProtectedRoute>
            <SSRCDashboardContent />
        </ProtectedRoute>
    );
}
