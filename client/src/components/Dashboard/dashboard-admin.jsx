'use client';

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./Layout/DashboardLayout";

// Import Section Components
import FinanceSection from "./Sections/FinanceSection";
import OverviewSection from "./Sections/OverviewSection";
import ProposalsSection from "./Sections/ProposalsSection";
import RolesSection from "./Sections/RolesSection";
import StaffSection from "./Sections/StaffSection";
import UsersSection from "./Sections/UsersSection";

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState('light'); // 'light' | 'dark' | 'darkest'

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'darkest';
      return 'light';
    });
  };

  // Metric State
  const [metrics, setMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]); // Array of keys
  const [activeMetric, setActiveMetric] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { metrics: data } = await import("../../utils/mockDashboardData").then(m => m.getMetrics());
        setMetrics(data);
        // Default selection: first 5
        const initialSelection = data.slice(0, 5).map(m => m.key);
        setSelectedMetrics(initialSelection);
        if (data.length > 0) {
          setActiveMetric(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const toggleMetric = (metricKey) => {
    if (selectedMetrics.includes(metricKey)) {
      // Deselect
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(prev => prev.filter(k => k !== metricKey));
        // If we removed the active metric, switch to the last one in the list (most recently added)
        if (activeMetric?.key === metricKey) {
          const remaining = selectedMetrics.filter(k => k !== metricKey);
          const nextMetricKey = remaining[remaining.length - 1]; // Switch to most recent
          const nextMetric = metrics.find(m => m.key === nextMetricKey);
          setActiveMetric(nextMetric);
        }
      }
    } else {
      // Select with FIFO logic (Queue)
      let newSelection = [...selectedMetrics];

      if (newSelection.length >= 5) {
        // Remove the first one (FIFO)
        newSelection.shift();
      }

      // Add new one to the end
      newSelection.push(metricKey);
      setSelectedMetrics(newSelection);

      // AUTO-SELECT the newly added metric
      const newMetric = metrics.find(m => m.key === metricKey);
      if (newMetric) {
        setActiveMetric(newMetric);
      }
    }
  };

  const resetMetrics = () => {
    if (metrics.length > 0) {
      const initialSelection = metrics.slice(0, 5).map(m => m.key);
      setSelectedMetrics(initialSelection);
      setActiveMetric(metrics[0]);
    }
  };

  const handleMetricClick = (metric) => {
    setActiveMetric(metric);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection
          metrics={metrics.filter(m => selectedMetrics.includes(m.key))}
          allMetrics={metrics}
          selectedMetrics={selectedMetrics}
          toggleMetric={toggleMetric}
          resetMetrics={resetMetrics}
          activeMetric={activeMetric}
          onMetricClick={handleMetricClick}
          theme={theme}
        />;
      case 'users':
        return <UsersSection theme={theme} />;
      case 'staff':
        return <StaffSection theme={theme} />;
      case 'proposals':
        return <ProposalsSection theme={theme} />;
      case 'finance':
        return <FinanceSection theme={theme} />;
      case 'roles':
        return <RolesSection theme={theme} />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      user={user}
      logout={logout}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {renderSection()}
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
