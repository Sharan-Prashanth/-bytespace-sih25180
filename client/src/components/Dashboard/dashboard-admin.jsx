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
        if (activeMetric?.key === metricKey) {
          const remaining = selectedMetrics.filter(k => k !== metricKey);
          const nextMetric = metrics.find(m => m.key === remaining[0]);
          setActiveMetric(nextMetric);
        }
      }
    } else {
      // Select with FIFO logic
      setSelectedMetrics(prev => {
        if (prev.length >= 5) {
          // Remove the first one (FIFO) and add the new one
          return [...prev.slice(1), metricKey];
        }
        return [...prev, metricKey];
      });
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
        />;
      case 'users':
        return <UsersSection />;
      case 'staff':
        return <StaffSection />;
      case 'proposals':
        return <ProposalsSection />;
      case 'finance':
        return <FinanceSection />;
      case 'roles':
        return <RolesSection />;
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
