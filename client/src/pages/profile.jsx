'use client';

import { useAuth } from "../context/AuthContext";
import Nav2 from "../components/Nav2";
import Profile from "../components/Profile";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Nav2 />
      <div className="flex-1">
        <Profile />
      </div>
    </div>
  );
}