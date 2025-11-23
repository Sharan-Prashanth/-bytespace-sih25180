'use client';

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import LoadingScreen from "../components/LoadingScreen";
import InvestigatorDashboard from "../components/Dashboard/dashboard-investigator";
import CMPDIDashboard from "../components/Dashboard/dashboard-cmpdi";
import ExpertDashboard from "../components/Dashboard/dashboard-expert";
import TSSRCDashboard from "../components/Dashboard/dashboard-tssrc";
import SSRCDashboard from "../components/Dashboard/dashboard-ssrc";
import SuperAdminDashboard from "../components/Dashboard/dashboard-admin";

function DashboardContent() {
  const { user, loading, isCMPDIMember, isExpertReviewer, isTSSRCMember, isSSRCMember, isSuperAdmin } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Route to appropriate dashboard based on user role
  // Super Admin has highest priority
  if (isSuperAdmin()) {
    return <SuperAdminDashboard />;
  }

  // Committee member dashboards
  if (isSSRCMember()) {
    return <SSRCDashboard />;
  }

  if (isTSSRCMember()) {
    return <TSSRCDashboard />;
  }

  if (isCMPDIMember()) {
    return <CMPDIDashboard />;
  }

  if (isExpertReviewer()) {
    return <ExpertDashboard />;
  }

  // Default: Principal Investigator/User dashboard
  return <InvestigatorDashboard />;
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
