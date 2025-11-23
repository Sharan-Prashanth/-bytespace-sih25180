'use client';

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const ProtectedRoute = ({ children, allowedRoles = [], requireOwnership = false, resourceId = null }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push("/login");
        return;
      }

      // Role-based access control
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/dashboard");
        return;
      }

      // Ownership check (for regular users accessing their own resources)
      if (requireOwnership && user.role === "user" && resourceId && user.id !== resourceId) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, loading, router, allowedRoles, requireOwnership, resourceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-orange-50 flex items-center justify-center">
        {/* Loading Container */}
        <div className="text-center">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
              <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {/* Rotating Ring */}
            <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">NaCCER Portal</h2>
            <p className="text-slate-600 font-medium">Verifying your credentials...</p>
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce animation-delay-400"></div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-20 w-32 h-32 bg-orange-200/20 rounded-full animate-float"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-red-200/20 rounded-full animate-float animation-delay-1000"></div>
            <div className="absolute top-1/2 left-10 w-16 h-16 bg-yellow-200/20 rounded-full animate-float animation-delay-2000"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null; // Will redirect to dashboard
  }

  return children;
};

export default ProtectedRoute;