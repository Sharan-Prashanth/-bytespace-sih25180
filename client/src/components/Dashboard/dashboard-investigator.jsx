'use client';

import { useEffect, useState } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../utils/api";
import { PROPOSAL_STATUS } from "../../utils/statusConfig";

// New Components
import UserDashboardLayout from "./User/Layout/UserDashboardLayout";
import UserOverviewSection from "./User/Sections/UserOverviewSection";
import UserProfileSection from "./User/Sections/UserProfileSection";
import UserProposalsSection from "./User/Sections/UserProposalsSection";
import UserSettingsSection from "./User/Sections/UserSettingsSection";

function InvestigatorDashboardContent() {
  const { user, logout } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState('light'); // 'light' | 'dark' | 'darkest'

  useEffect(() => {
    fetchProposals();

    // Load theme from local storage if available
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkest' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/proposals');
      const proposalData = response.data?.data?.proposals || response.data?.proposals || [];
      setProposals(Array.isArray(proposalData) ? proposalData : []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === PROPOSAL_STATUS.DRAFT).length,
    underReview: proposals.filter(p =>
      p.status === PROPOSAL_STATUS.CMPDI_REVIEW ||
      p.status === PROPOSAL_STATUS.CMPDI_EXPERT_REVIEW ||
      p.status === PROPOSAL_STATUS.TSSRC_REVIEW ||
      p.status === PROPOSAL_STATUS.SSRC_REVIEW
    ).length,
    approved: proposals.filter(p =>
      p.status === PROPOSAL_STATUS.ONGOING ||
      p.status === PROPOSAL_STATUS.COMPLETED
    ).length,
    rejected: proposals.filter(p =>
      p.status === PROPOSAL_STATUS.CMPDI_REJECTED ||
      p.status === PROPOSAL_STATUS.TSSRC_REJECTED ||
      p.status === PROPOSAL_STATUS.SSRC_REJECTED
    ).length,
    totalBudget: proposals.reduce((sum, p) => sum + (p.outlayLakhs || 0), 0)
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <UserOverviewSection stats={stats} theme={theme} />;
      case 'proposals':
        return <UserProposalsSection proposals={proposals} theme={theme} />;
      case 'profile':
        return <UserProfileSection user={user} theme={theme} />;
      case 'settings':
        return <UserSettingsSection theme={theme} toggleTheme={toggleTheme} />;
      default:
        return <UserOverviewSection stats={stats} theme={theme} />;
    }
  };

  return (
    <UserDashboardLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      user={user}
      logout={logout}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {renderSection()}
    </UserDashboardLayout>
  );
}

export default function InvestigatorDashboard() {
  return (
    <ProtectedRoute>
      <InvestigatorDashboardContent />
    </ProtectedRoute>
  );
}
