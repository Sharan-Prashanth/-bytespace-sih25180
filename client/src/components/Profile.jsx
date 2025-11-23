'use client';

import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import apiClient from "../utils/api";

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
      postalCode: ""
    },
    expertiseDomains: []
  });
  const [newExpertise, setNewExpertise] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Initialize form data when user data is available
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
          postalCode: ""
        },
        expertiseDomains: user.expertiseDomains || []
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertiseDomains.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertiseDomains: [...prev.expertiseDomains, newExpertise.trim()]
      }));
      setNewExpertise("");
    }
  };

  const removeExpertise = (expertiseToRemove) => {
    setFormData(prev => ({
      ...prev,
      expertiseDomains: prev.expertiseDomains.filter(exp => exp !== expertiseToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Basic validation
    if (!formData.fullName?.trim()) {
      setMessage({ type: "error", text: "Full name is required" });
      return;
    }
    
    if (!formData.email?.trim()) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }
    
    if (!formData.designation?.trim()) {
      setMessage({ type: "error", text: "Designation is required" });
      return;
    }
    
    if (!formData.organisationName?.trim()) {
      setMessage({ type: "error", text: "Organisation name is required" });
      return;
    }
    
    setUpdateLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await apiClient.put('/api/auth/profile', formData);
      console.log('Response received:', response.status, response.data);

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      // Update user context without reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Please log in again to update your profile" });
      } else {
        setMessage({ 
          type: "error", 
          text: error.response?.data?.message || "Failed to update profile. Please try again." 
        });
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const getRoleColor = (roles) => {
    if (!roles || roles.length === 0) return 'from-blue-500 to-blue-600';
    // Use first role for color
    const role = roles[0];
    switch (role) {
      case 'USER': return 'from-blue-500 to-indigo-600';
      case 'EXPERT_REVIEWER': return 'from-purple-500 to-violet-600';
      case 'CMPDI_MEMBER': return 'from-emerald-500 to-teal-600';
      case 'TSSRC_MEMBER': return 'from-orange-500 to-red-600';
      case 'SSRC_MEMBER': return 'from-pink-500 to-rose-600';
      case 'SUPER_ADMIN': return 'from-red-500 to-rose-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getRoleIcon = (roles) => {
    if (!roles || roles.length === 0) return null;
    const role = roles[0];
    switch (role) {
      case 'USER':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'EXPERT_REVIEWER':
      case 'CMPDI_MEMBER':
      case 'TSSRC_MEMBER':
      case 'SSRC_MEMBER':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'SUPER_ADMIN':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-600 rounded-full animate-spin animation-delay-300"></div>
          </div>
          <span className="text-black font-bold">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-black font-bold">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Show loading screen during profile update
  if (updateLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-white py-12 px-4 sm:px-6 lg:px-8">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-blue-200 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="relative">
                  <div className={`w-32 h-32 bg-gradient-to-br ${getRoleColor(user.roles)} rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl transform group-hover:scale-105 transition-all duration-300`}>
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br ${getRoleColor(user.roles)} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {getRoleIcon(user.roles)}
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
              </div>

              {/* User Information */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
                    {user.fullName}
                  </h1>
                  <p className="text-xl text-black font-bold">{user.email}</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center lg:items-start lg:justify-start justify-center mb-6">
                  {user.roles && user.roles.map((role, index) => (
                    <span key={index} className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${getRoleColor([role])} text-white rounded-full font-semibold shadow-lg`}>
                      {getRoleIcon([role])}
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                  
                  {user.designation && (
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {user.designation}
                    </span>
                  )}
                </div>

                {/* Expertise Tags */}
                {user.expertiseDomains && user.expertiseDomains.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {user.expertiseDomains.slice(0, 5).map((exp, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold border border-blue-700 hover:bg-blue-700 transition-colors shadow-md"
                        >
                          {exp}
                        </span>
                      ))}
                      {user.expertiseDomains.length > 5 && (
                        <span className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md">
                          +{user.expertiseDomains.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Edit button clicked, current isEditing:', isEditing);
                    setIsEditing(!isEditing);
                    if (!isEditing) {
                      // Reset message when entering edit mode
                      setMessage({ type: "", text: "" });
                    }
                  }}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isEditing 
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-2 border-transparent'
                  }`}
                  disabled={updateLoading}
                >
                  {updateLoading ? "Processing..." : (isEditing ? "Cancel Edit" : "Edit Profile")}
                </button>
                
                <div className="text-center text-sm text-black font-bold">
                  Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
          <div className={`p-4 rounded-2xl shadow-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border-2 border-green-200 text-green-800' 
              : 'bg-red-50 border-2 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Profile Form - Main Content */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl border border-blue-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-black">Profile Information</h2>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Phone Number</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Designation *</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g., Research Scholar, Professor"
                        className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Organisation Name *</label>
                      <input
                        type="text"
                        name="organisationName"
                        value={formData.organisationName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-black uppercase tracking-wide">Organisation Type *</label>
                      <select
                        name="organisationType"
                        value={formData.organisationType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                        required
                      >
                        <option value="INDIAN_ACADEMIC_RESEARCH">Indian Academic/Research Institution</option>
                        <option value="INDIAN_GOVT_ORGANISATION">Indian Government Organisation</option>
                        <option value="PUBLIC_SECTOR_SUBSIDIARY">Public Sector Subsidiary</option>
                        <option value="FOREIGN_INSTITUTE">Foreign Institute</option>
                        <option value="CMPDI">CMPDI</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-black uppercase tracking-wide">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-black font-bold"
                      required
                    />
                  </div>

                  {/* Address Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-black">Address (Optional)</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="address.line1"
                        value={formData.address.line1}
                        onChange={handleInputChange}
                        placeholder="Address Line 1"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-bold"
                      />
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Enhanced Expertise Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Expertise Domains</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        placeholder="Add your expertise domain..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-bold"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                      />
                      <button
                        type="button"
                        onClick={addExpertise}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Add
                      </button>
                    </div>
                    
                    {formData.expertiseDomains.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-900">Current Expertise Domains:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {formData.expertiseDomains.map((exp, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-800 px-4 py-3 rounded-xl font-medium group hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                            >
                              <span className="flex-1">{exp}</span>
                              <button
                                type="button"
                                onClick={() => removeExpertise(exp)}
                                className="w-6 h-6 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      {updateLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setMessage({ type: "", text: "" });
                      }}
                      disabled={updateLoading}
                      className="px-8 py-4 border-2 border-gray-800 text-gray-900 bg-white rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Full Name</label>
                      <p className="text-2xl text-black font-bold bg-white/50 p-2 rounded">{user.name}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Email Address</label>
                      <p className="text-xl text-black font-bold bg-white/50 p-2 rounded">{user.email}</p>
                    </div>
                  </div>

                  {user.department && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Department</label>
                      <p className="text-xl text-black font-bold bg-white/50 p-2 rounded">{user.department}</p>
                    </div>
                  )}

                  {user.expertise && user.expertise.length > 0 && (
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Areas of Expertise</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {user.expertise.map((exp, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-xl font-bold text-center"
                          >
                            {exp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Account Status Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Account Status</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-900 font-bold">Status</span>
                  <span className="inline-flex items-center gap-2 text-green-700 font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-900 font-bold">Role</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRoleColor(user.role)}`}>
                    {user.role?.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-900 font-bold">Member Since</span>
                  <span className="text-gray-900 font-bold">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-white`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user.role === 'user' && 'Research Activity'}
                  {user.role === 'reviewer' && 'Review Activity'}  
                  {user.role === 'staff' && 'Project Activity'}
                </h3>
              </div>
              
              <div className="space-y-4">
                {user.role === 'user' && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Proposals Submitted</span>
                        <span className="text-2xl font-bold text-blue-600">0</span>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Active Projects</span>
                        <span className="text-2xl font-bold text-green-600">0</span>
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'reviewer' && (
                  <>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Reviews Completed</span>
                        <span className="text-2xl font-bold text-purple-600">0</span>
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Pending Reviews</span>
                        <span className="text-2xl font-bold text-orange-600">0</span>
                      </div>
                    </div>
                  </>
                )}
                {user.role === 'staff' && (
                  <>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Assigned Projects</span>
                        <span className="text-2xl font-bold text-emerald-600">0</span>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Completed Tasks</span>
                        <span className="text-2xl font-bold text-blue-600">0</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  View Dashboard
                </button>
                <button 
                  onClick={() => window.print()}
                  className="w-full p-3 bg-black hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300"
                >
                  Print Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}