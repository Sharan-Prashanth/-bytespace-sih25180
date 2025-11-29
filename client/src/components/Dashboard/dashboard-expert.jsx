'use client';

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import LoadingScreen from "../../components/LoadingScreen";
import apiClient from "../../utils/api";
import ExpertDashboardLayout from "./Expert/Layout/ExpertDashboardLayout";
import ExpertHome from "./Expert/Sections/ExpertHome";
import ExpertProposals from "./Expert/Sections/ExpertProposals";

// Placeholder components for sections not yet implemented
const PlaceholderSection = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>Module coming soon...</p>
    </div>
);

function ExpertDashboardContent() {
  const { user, logout } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState('light'); // Default to light to match CMPDI style initially
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

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

  // Calculate stats
  const stats = {
    totalAssigned: proposals.length,
    pendingReviews: proposals.filter(p => {
      const assignment = p.assignedReviewers?.find(ar => ar.reviewer === user?._id);
      return assignment?.status === 'PENDING' || assignment?.status === 'IN_PROGRESS';
    }).length,
    reviewsSubmitted: proposals.filter(p => {
      const assignment = p.assignedReviewers?.find(ar => ar.reviewer === user?._id);
      return assignment?.status === 'COMPLETED';
    }).length,
    overdue: proposals.filter(p => {
      const assignment = p.assignedReviewers?.find(ar => ar.reviewer === user?._id);
      if (!assignment?.dueDate) return false;
      return new Date(assignment.dueDate) < new Date() && assignment.status !== 'COMPLETED';
    }).length
  };

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
              return <ExpertHome stats={stats} theme={theme} proposals={proposals} user={user} onViewCalendar={() => setShowCalendar(true)} />;
          case 'proposals':
              return <ExpertProposals proposals={proposals} user={user} theme={theme} />;
          case 'reviews':
              return <PlaceholderSection title="My Reviews" />;
          case 'history':
              return <PlaceholderSection title="History" />;
          default:
              return <ExpertHome stats={stats} theme={theme} onViewCalendar={() => setShowCalendar(true)} />;
      }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ExpertDashboardLayout
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        logout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
    >
        {renderSection()}
    </ExpertDashboardLayout>
  );
}

export default function ExpertDashboard() {
  return (
    <ProtectedRoute>
      <ExpertDashboardContent />
    </ProtectedRoute>
  );
}