'use client';

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingScreen from "../../components/LoadingScreen";
import TSSRCDashboardLayout from "./TSSRC/Layout/TSSRCDashboardLayout";
import TSSRCHome from "./TSSRC/Sections/TSSRCHome";
import TSSRCProposalsSection from "./TSSRC/Sections/TSSRCProposalsSection";

// Placeholder for sections not yet implemented
const PlaceholderSection = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>Module coming soon...</p>
    </div>
);

function TSSRCDashboardContent() {
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
                return <TSSRCHome theme={theme} />;
            case 'proposals':
                return <TSSRCProposalsSection theme={theme} />;
            default:
                return <TSSRCHome theme={theme} />;
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <TSSRCDashboardLayout
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            theme={theme}
            toggleTheme={toggleTheme}
        >
            {renderSection()}
        </TSSRCDashboardLayout>
    );
}

export default function TSSRCDashboard() {
    return (
        <ProtectedRoute>
            <TSSRCDashboardContent />
        </ProtectedRoute>
    );
}
