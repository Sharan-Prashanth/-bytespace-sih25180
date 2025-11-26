"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import apiClient from "../utils/api";
import { StatCard } from "./profile-stats-cards";
import { ProfileChart } from "./profile-chart";

export default function Profile() {
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    designation: "",
    organisationName: "",
    organisationType: "",
    country: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
    },
    expertiseDomains: [],
  });
  const [newExpertise, setNewExpertise] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Mock data for charts
  const activityData = [
    { name: "Jan", value: 45 },
    { name: "Feb", value: 52 },
    { name: "Mar", value: 48 },
    { name: "Apr", value: 61 },
    { name: "May", value: 55 },
    { name: "Jun", value: 67 },
    { name: "Jul", value: 72 },
  ];

  const engagementData = [
    { name: "Week 1", projects: 12, reviews: 8 },
    { name: "Week 2", projects: 19, reviews: 12 },
    { name: "Week 3", projects: 15, reviews: 10 },
    { name: "Week 4", projects: 22, reviews: 14 },
  ];

  const performanceData = [
    { name: "Reviews", value: 95 },
    { name: "Collaboration", value: 87 },
    { name: "Expertise", value: 92 },
    { name: "Communication", value: 88 },
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        designation: user.designation || "",
        organisationName: user.organisationName || "",
        organisationType: user.organisationType || "",
        country: user.country || "",
        address: user.address || {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
        },
        expertiseDomains: user.expertiseDomains || [],
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName?.trim()) {
      setMessage({ type: "error", text: "Full name is required" });
      return;
    }
    if (!formData.email?.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    setUpdateLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await apiClient.put("/api/auth/profile", formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Please log in again to update your profile" });
      } else {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to update profile. Please try again.",
        });
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const getRoleColor = (roles) => {
    if (!roles || roles.length === 0) return "from-blue-500 to-indigo-600";
    const role = roles[0];
    switch (role) {
      case "USER":
        return "from-blue-500 to-indigo-600";
      case "EXPERT_REVIEWER":
        return "from-purple-500 to-indigo-600";
      case "CMPDI_MEMBER":
        return "from-emerald-500 to-teal-600";
      case "TSSRC_MEMBER":
        return "from-orange-500 to-red-600";
      case "SSRC_MEMBER":
        return "from-pink-500 to-rose-600";
      case "SUPER_ADMIN":
        return "from-red-500 to-rose-600";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <span className="text-slate-900 font-bold">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center pt-20">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-slate-900 font-bold">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (updateLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-slate-50 py-12 px-4 sm:px-6 lg:px-8 border-b border-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-blue-200 rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className={`w-32 h-32 bg-gradient-to-br ${getRoleColor(user.roles)} rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl transform group-hover:scale-105 transition-all duration-300`}
                >
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">{user.fullName}</h1>
                <p className="text-lg text-slate-600 mb-4">{user.email}</p>

                <div className="flex flex-wrap gap-3 mb-6">
                  {user.roles?.map((role, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${getRoleColor([role])} text-white rounded-full font-semibold shadow-lg text-sm`}
                    >
                      {role.replace("_", " ")}
                    </span>
                  ))}
                  {user.designation && (
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg text-sm">
                      {user.designation}
                    </span>
                  )}
                </div>

                {/* Expertise */}
                {user.expertiseDomains?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                      Areas of Expertise
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.expertiseDomains.slice(0, 5).map((exp, idx) => (
                        <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold border border-blue-200">
                          {exp}
                        </span>
                      ))}
                      {user.expertiseDomains.length > 5 && (
                        <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border border-slate-200">
                          +{user.expertiseDomains.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setMessage({ type: "", text: "" });
                  }}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${isEditing
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-2 border-transparent"
                    }`}
                >
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </button>
                <p className="text-sm text-slate-600 text-center font-semibold">
                  Member since{" "}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
          <div
            className={`p-4 rounded-2xl shadow-lg ${message.type === "success"
                ? "bg-green-50 border-2 border-green-200 text-green-800"
                : "bg-red-50 border-2 border-red-200 text-red-800"
              }`}
          >
            <div className="flex items-center gap-3">
              {message.type === "success" ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!isEditing && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Reviews"
                value="287"
                change="+12%"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7 12a5 5 0 1110 0A5 5 0 017 12z"
                    />
                  </svg>
                }
              />
              <StatCard
                label="Projects Contributed"
                value="42"
                change="+8%"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                }
              />
              <StatCard
                label="Avg. Review Score"
                value="4.8/5"
                change="+0.3"
                trend="up"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                }
              />
              <StatCard
                label="Active Domains"
                value="8"
                change="Stable"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileChart
                title="Activity Trend"
                type="area"
                data={activityData}
                dataKey="value"
                fill="rgba(59, 130, 246, 0.3)"
                stroke="#3b82f6"
              />
              <ProfileChart
                title="Engagement Metrics"
                type="bar"
                data={engagementData}
                dataKey="projects"
                fill="#6366f1"
              />
            </div>

            {/* Performance Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileChart title="Performance Breakdown" type="line" data={performanceData} dataKey="value" stroke="#3b82f6" />
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Expertise Domains</h3>
                <div className="space-y-4">
                  {user.expertiseDomains?.length > 0 ? (
                    user.expertiseDomains.map((domain, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-900 font-semibold">{domain}</span>
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            style={{ width: `${75 + Math.random() * 25}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600">No expertise domains added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
