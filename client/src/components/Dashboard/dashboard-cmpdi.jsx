'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import { getCMPDIMetrics } from '../../utils/cmpdiMock/metrics';
import CMPDIDashboardLayout from './CMPDI/Layout/CMPDIDashboardLayout';
import CMPDIHome from './CMPDI/Sections/CMPDIHome';
import ProjectsSection from './CMPDI/Sections/ProjectsSection';
import CMPDIProposalsSection from './CMPDI/Sections/CMPDIProposalsSection';
import ExpertsSection from './CMPDI/Sections/ExpertsSection';
import FinanceSection from './CMPDI/Sections/FinanceSection';
import GISSection from './CMPDI/Sections/GISSection';

// Placeholder components for sections not yet implemented
const PlaceholderSection = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>Module coming soon...</p>
    </div>
);

export default function CMPDIDashboard() {
    const [activeSection, setActiveSection] = useState('overview');
    const [theme, setTheme] = useState('light'); // 'light' | 'dark' | 'darkest'
    const [metrics, setMetrics] = useState([]);
    const [selectedMetrics, setSelectedMetrics] = useState([]); // Array of keys
    const [activeMetric, setActiveMetric] = useState(null);
    const [loading, setLoading] = useState(true);
    const [proposals, setProposals] = useState([]);
    
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Metrics Configuration
                const metricsData = await getCMPDIMetrics();
                setMetrics(metricsData.metrics);
                // Default selection (first 5)
                const defaults = metricsData.metrics.slice(0, 5).map(m => m.key);
                setSelectedMetrics(defaults);
                setActiveMetric(metricsData.metrics[0]);

                // Fetch Real Proposals Data
                const response = await apiClient.get('/api/proposals');
                if (response.data && Array.isArray(response.data.data)) {
                    setProposals(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setProposals(response.data);
                } else {
                    console.warn("Unexpected proposals API response format:", response.data);
                    setProposals([]);
                }

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Theme Toggle
    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'darkest';
            return 'light';
        });
    };

    // Metric Selection Logic (FIFO)
    const toggleMetric = (key) => {
        setSelectedMetrics(prev => {
            if (prev.includes(key)) {
                // Don't allow unchecking if it's the only one (optional, but good UX)
                if (prev.length === 1) return prev;
                return prev.filter(k => k !== key);
            } else {
                const newSelection = [...prev, key];
                if (newSelection.length > 5) {
                    // Remove the first one (FIFO)
                    return newSelection.slice(1);
                }
                return newSelection;
            }
        });
    };

    const resetMetrics = () => {
        if (metrics.length > 0) {
            const defaults = metrics.slice(0, 5).map(m => m.key);
            setSelectedMetrics(defaults);
            setActiveMetric(metrics[0]);
        }
    };

    const handleMetricClick = (metric) => {
        setActiveMetric(metric);
    };

    // Calculate stats from real proposals
    const safeProposals = Array.isArray(proposals) ? proposals : [];
    const stats = {
        total: safeProposals.length,
        newProposals: safeProposals.filter(p => p.status === 'SUBMITTED' || p.status === 'AI_EVALUATION').length,
        underReview: safeProposals.filter(p => p.status === 'CMPDI_REVIEW').length,
        withExperts: safeProposals.filter(p => p.status === 'CMPDI_EXPERT_REVIEW').length,
        approved: safeProposals.filter(p => p.status === 'CMPDI_APPROVED' || p.status === 'ONGOING').length,
        rejected: safeProposals.filter(p => p.status === 'CMPDI_REJECTED' || p.status === 'REJECTED').length,
        totalBudget: safeProposals.reduce((sum, p) => sum + (p.totalBudget || 0), 0)
    };

    // Merge real stats with metrics configuration
    const mergedMetrics = metrics.map(m => {
        switch (m.key) {
            case 'proposalsSubmitted': return { ...m, value: stats.total };
            case 'activeProjects': return { ...m, value: stats.approved }; // Assuming approved become active
            case 'fundsAllocated': return { ...m, value: `₹${(stats.totalBudget / 10000000).toFixed(1)}Cr` };
            case 'pendingReviews': return { ...m, value: stats.underReview + stats.withExperts };
            default: return m;
        }
    });

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <CMPDIHome
                    metrics={mergedMetrics.filter(m => selectedMetrics.includes(m.key))}
                    allMetrics={mergedMetrics}
                    selectedMetrics={selectedMetrics}
                    toggleMetric={toggleMetric}
                    resetMetrics={resetMetrics}
                    activeMetric={activeMetric}
                    onMetricClick={handleMetricClick}
                    theme={theme}
                />;
            case 'projects':
                return <ProjectsSection theme={theme} />;
            case 'proposals':
                return <CMPDIProposalsSection theme={theme} />;
            case 'experts':
                return <ExpertsSection theme={theme} />;
            case 'finance':
                return <FinanceSection theme={theme} />;
            case 'gis':
                return <GISSection theme={theme} />;
            default:
                return <CMPDIHome />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <CMPDIDashboardLayout
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            user={user || { fullName: 'CMPDI Admin' }}
            logout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
        >
            {renderSection()}
        </CMPDIDashboardLayout>
    );
}
