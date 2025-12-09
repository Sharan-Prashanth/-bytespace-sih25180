'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import LoadingScreen from "../../components/LoadingScreen";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../utils/api";
import { PROPOSAL_STATUS, isRejected } from "../../utils/statusConfig";

// New Components
import UserDashboardLayout from "./User/Layout/UserDashboardLayout";
import UserOverviewSection from "./User/Sections/UserOverviewSection";
import UserProfileSection from "./User/Sections/UserProfileSection";
import UserProposalsSection from "./User/Sections/UserProposalsSection";
import UserSettingsSection from "./User/Sections/UserSettingsSection";

function InvestigatorDashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState('light'); // 'light' | 'dark' | 'darkest'

  useEffect(() => {
    if (router.isReady && router.query.section) {
      setActiveSection(router.query.section);
    }
  }, [router.isReady, router.query.section]);

  useEffect(() => {
    fetchProposals();

    // Load theme from local storage if available
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const setAndSaveTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
    // Also save to user preferences if logged in
    if (user?._id) {
      apiClient.put(`/api/users/${user._id}`, { preferredTheme: newTheme }).catch(() => {});
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkest' : 'light';
    setAndSaveTheme(newTheme);
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/proposals');
      let proposalData = response.data?.data?.proposals || response.data?.proposals || [];
      
      // Update proposal statuses based on aiReports (if validation completed while status is still pending)
      proposalData = proposalData.map(proposal => {
        if (proposal.status === PROPOSAL_STATUS.AI_VALIDATION_PENDING && proposal.aiReports?.length > 0) {
          // Find the validation report for the current version
          const validationReport = proposal.aiReports.find(
            report => report.reportType === 'validation' && report.version === proposal.currentVersion
          );
          
          if (validationReport) {
            // Check validation result
            const overallValidation = validationReport.reportData?.validation_result?.overall_validation;
            
            if (overallValidation === true) {
              // Validation passed - should be in CMPDI_REVIEW now
              proposal.status = PROPOSAL_STATUS.CMPDI_REVIEW;
            } else if (overallValidation === false) {
              // Validation failed
              proposal.status = PROPOSAL_STATUS.AI_VALIDATION_FAILED;
            }
            // If overall_validation is undefined, status remains AI_VALIDATION_PENDING (still processing)
          }
        }
        
        return proposal;
      });
      
      setProposals(Array.isArray(proposalData) ? proposalData : []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle proposal deletion - refresh the list after deletion
  const handleProposalDeleted = (deletedProposalId) => {
    // Remove the deleted proposal from local state immediately for better UX
    setProposals(prev => prev.filter(p => p._id !== deletedProposalId));
  };

  // Filter out rejected proposals for the main view
  const activeProposals = proposals.filter(p => !isRejected(p.status));
  const rejectedProposals = proposals.filter(p => isRejected(p.status));

  // Find the most recent draft (sorted by updatedAt)
  const lastDraft = [...proposals]
    .filter(p => p.status === PROPOSAL_STATUS.DRAFT || p.status === PROPOSAL_STATUS.AI_VALIDATION_FAILED)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  // Calculate stats
  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === PROPOSAL_STATUS.DRAFT).length,
    aiPending: proposals.filter(p => p.status === PROPOSAL_STATUS.AI_VALIDATION_PENDING).length,
    underReview: proposals.filter(p =>
      p.status === PROPOSAL_STATUS.CMPDI_REVIEW ||
      p.status === PROPOSAL_STATUS.CMPDI_EXPERT_REVIEW ||
      p.status === PROPOSAL_STATUS.TSSRC_REVIEW ||
      p.status === PROPOSAL_STATUS.SSRC_REVIEW
    ).length,
    approved: proposals.filter(p =>
      p.status === PROPOSAL_STATUS.CMPDI_ACCEPTED ||
      p.status === PROPOSAL_STATUS.TSSRC_ACCEPTED ||
      p.status === PROPOSAL_STATUS.SSRC_ACCEPTED
    ).length,
    rejected: proposals.filter(p => isRejected(p.status)).length
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <UserOverviewSection stats={stats} theme={theme} proposals={proposals} lastDraft={lastDraft} />;
      case 'proposals':
        return <UserProposalsSection proposals={proposals} theme={theme} onProposalDeleted={handleProposalDeleted} />;
      case 'profile':
        return <UserProfileSection user={user} theme={theme} />;
      case 'settings':
        return <UserSettingsSection theme={theme} setTheme={setAndSaveTheme} />;
      default:
        return <UserOverviewSection stats={stats} theme={theme} proposals={proposals} lastDraft={lastDraft} />;
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
