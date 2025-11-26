'use client';

import { useRouter } from "next/router";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
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
