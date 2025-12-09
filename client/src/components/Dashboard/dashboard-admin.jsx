'use client';

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./Layout/DashboardLayout";

// Import Section Components
import FinanceSection from "./Sections/FinanceSection";
import GISMapSection from "./Sections/GISMapSection";
import OverviewSection from "./Sections/OverviewSection";
import AdminProposalsSection from "./Admin/Sections/AdminProposalsSection";
import RolesSection from "./Sections/RolesSection";
import StaffSection from "./Sections/StaffSection";
import UsersSection from "./Sections/UsersSection";
import WeightageMeterSection from "./Sections/WeightageMeterSection";

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

  // Sidebar Control State
  const [controlMetricKey, setControlMetricKey] = useState(null);
  const [overrideValues, setOverrideValues] = useState(null);
  const [overrideMonths, setOverrideMonths] = useState(null);

  // Fetch Metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { metrics: data } = await import("../../utils/mockDashboardData").then(m => m.getMetrics());
        setMetrics(data);
        // Default selection: first 4
        const initialSelection = data.slice(0, 4).map(m => m.key);
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
      }
    } else {
      // Select with FIFO logic (Queue)
      let newSelection = [...selectedMetrics];

      if (newSelection.length >= 4) {
        // Remove the first one (FIFO)
        newSelection.shift();
      }

      // Add new one to the end
      newSelection.push(metricKey);
      setSelectedMetrics(newSelection);
    }
  };

  const resetMetrics = () => {
    if (metrics.length > 0) {
      const initialSelection = metrics.slice(0, 4).map(m => m.key);
      setSelectedMetrics(initialSelection);
    }
  };

  const handleMetricClick = (metric) => {
    setActiveMetric(metric);
  };

  const handleControlMetricSelect = (metric) => {
    console.log('Control Metric Selected:', metric?.key);
    setControlMetricKey(metric?.key);
  };

  const handleValueChange = (val) => {
    console.log('Value Range Changed:', val);
    setOverrideValues(val);
  };

  const handleMonthChange = (val) => {
    console.log('Month Range Changed:', val);
    setOverrideMonths(val);
  };

  // Memoize sidebar props to prevent infinite loop
  // MUST be before any conditional return
  const sidebarControlProps = useMemo(() => ({
    metrics: metrics.filter(m => selectedMetrics.includes(m.key)),
    selectedMetrics: selectedMetrics,
    onMetricSelect: handleControlMetricSelect,
    onValueChange: handleValueChange,
    onMonthChange: handleMonthChange
  }), [metrics, selectedMetrics]);

  // Proposal search term state for navigation from UsersSection
  const [proposalSearchTerm, setProposalSearchTerm] = useState('');

  const handleNavigateToProposals = (searchTerm) => {
    setProposalSearchTerm(searchTerm);
    setActiveSection('proposals');
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
          controlMetricKey={controlMetricKey || selectedMetrics[0]}
          overrideValues={overrideValues}
          overrideMonths={overrideMonths}
        />;
      case 'users':
        return <UsersSection theme={theme} onNavigateToProposals={handleNavigateToProposals} />;
      case 'staff':
        return <StaffSection theme={theme} />;
      case 'proposals':
        return <AdminProposalsSection theme={theme} initialSearchTerm={proposalSearchTerm} />;
      case 'finance':
        return <FinanceSection theme={theme} />;
      case 'gismap':
        return <GISMapSection theme={theme} />;
      case 'roles':
        return <RolesSection theme={theme} />;
      case 'weightage':
        return <WeightageMeterSection theme={theme} />;
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
      sidebarControlProps={sidebarControlProps}
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