'use client';

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { StatCard } from "./profile-stats-cards";
import { ProfileChart } from "./profile-chart";
import apiClient from "../utils/api";

export default function Profile() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [proposalCounts, setProposalCounts] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    ongoing: 0,
    completed: 0
  });
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch proposal counts and activities when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      
      setLoadingData(true);
      try {
        // Fetch proposal counts
        const countsResponse = await apiClient.get(`/api/users/${user._id}/proposals/count`);
        if (countsResponse.data.success) {
          setProposalCounts(countsResponse.data.data);
        }

        // Fetch activities
        const activitiesResponse = await apiClient.get(`/api/users/${user._id}/activities`);
        if (activitiesResponse.data.success) {
          setActivities(activitiesResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?._id]);

  // Generate chart data from proposal counts
  const proposalStatusData = [
    { name: 'Draft', value: proposalCounts.draft, color: '#94a3b8' },
    { name: 'Submitted', value: proposalCounts.submitted, color: '#3b82f6' },
    { name: 'Under Review', value: proposalCounts.underReview, color: '#f59e0b' },
    { name: 'Approved', value: proposalCounts.approved, color: '#10b981' },
    { name: 'Ongoing', value: proposalCounts.ongoing, color: '#8b5cf6' },
    { name: 'Completed', value: proposalCounts.completed, color: '#06b6d4' },
  ].filter(item => item.value > 0);

  // Sample monthly submission data (would be fetched from API in production)
  const monthlySubmissionsData = [
    { name: 'Jan', submissions: 0 },
    { name: 'Feb', submissions: 0 },
    { name: 'Mar', submissions: 0 },
    { name: 'Apr', submissions: 0 },
    { name: 'May', submissions: 0 },
    { name: 'Jun', submissions: 0 },
    { name: 'Jul', submissions: 1 },
    { name: 'Aug', submissions: 2 },
    { name: 'Sep', submissions: 1 },
    { name: 'Oct', submissions: 0 },
    { name: 'Nov', submissions: Math.max(proposalCounts.submitted, 1) },
    { name: 'Dec', submissions: 0 },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-slate-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar - Dark Profile Card */}
      <div className="w-80 bg-gray-900 text-white p-6 flex flex-col sticky top-16 h-screen overflow-y-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold">
            {user.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold mb-1">{user.fullName || 'User Name'}</h2>
          <p className="text-gray-400 text-sm">{user.designation || 'Project Manager'}</p>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            Edit Profile
          </button>
        </div>

        {/* Info Section */}
        <div className="space-y-6 flex-1">
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4">Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">EMAIL</p>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">PHONE</p>
                <p className="text-sm text-gray-300">{user.phoneNumber || '+123-4567-8900'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">LOCATION</p>
                <p className="text-sm text-gray-300">{user.address?.city || 'New York, NY'}</p>
              </div>
            </div>
          </div>

          {/* Favorites Section */}
          <div>
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4">Favorites</h3>
            <div className="space-y-3">
              {['Research Team', 'Admin Panel', 'Analytics'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500"></div>
                  <div>
                    <p className="text-sm font-medium">{item}</p>
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'activity' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'}`}
            >
              Activity
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>18 Aug - 25 Aug</span>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading statistics...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  label="Total Proposals"
                  value={proposalCounts.total.toString()}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
                <StatCard
                  label={user?.roles?.some(role => ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role)) ? "Under Review" : "Submitted"}
                  value={proposalCounts.submitted.toString()}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label={user?.roles?.some(role => ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(role)) ? "Reviews Completed" : "Approved"}
                  value={proposalCounts.completed || proposalCounts.approved.toString()}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Ongoing Projects"
                  value={proposalCounts.ongoing.toString()}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ProfileChart
                title="Monthly Submissions"
                type="bar"
                data={monthlySubmissionsData}
                dataKey="submissions"
                fill="#3b82f6"
              />
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Proposal Status Distribution</h3>
                {proposalStatusData.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-slate-500">No proposals yet</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center h-64">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="80" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                          <circle 
                            cx="96" cy="96" r="80" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="16" 
                            strokeDasharray="502" 
                            strokeDashoffset={502 - (502 * (proposalCounts.approved + proposalCounts.ongoing + proposalCounts.completed) / Math.max(proposalCounts.total, 1))} 
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900">{proposalCounts.total}</span>
                          <span className="text-sm text-slate-600">Total</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      {proposalStatusData.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-slate-700">{item.name}: {item.value}</span>
                          </div>
                          <span className="text-slate-500">
                            {((item.value / Math.max(proposalCounts.total, 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row - Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expertise Areas */}
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Expertise Domains</h3>
                {user?.expertiseDomains && user.expertiseDomains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.expertiseDomains.map((domain, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No expertise domains specified</p>
                )}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Organization</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-slate-700">{user?.organisationName || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-700">{user?.designation || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Success Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {proposalCounts.total > 0 
                        ? `${(((proposalCounts.approved + proposalCounts.ongoing + proposalCounts.completed) / proposalCounts.total) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Active Projects</span>
                    <span className="text-lg font-bold text-blue-600">{proposalCounts.ongoing}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Completed Projects</span>
                    <span className="text-lg font-bold text-purple-600">{proposalCounts.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Account Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Member Since</span>
                    <span className="text-sm font-medium text-slate-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border border-blue-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Activity Log</h3>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-600">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <p className="text-slate-600">No recent activities found.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        {getActivityIcon(activity.action)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {getActivityTitle(activity.action)}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {activity.proposalId?.proposalCode && (
                              <span className="font-medium text-blue-600">
                                {activity.proposalId.proposalCode}
                              </span>
                            )}
                            {activity.proposalId?.title && (
                              <span className="ml-2">{activity.proposalId.title}</span>
                            )}
                            {activity.details?.oldStatus && activity.details?.newStatus && (
                              <span className="ml-2">
                                from <span className="font-medium">{activity.details.oldStatus}</span> to{' '}
                                <span className="font-medium">{activity.details.newStatus}</span>
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {formatActivityDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.fullName}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue={user.phoneNumber}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Designation</label>
                <input
                  type="text"
                  defaultValue={user.designation}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions for activity display
  function getActivityIcon(action) {
    const iconMap = {
      PROPOSAL_CREATED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      PROPOSAL_SUBMITTED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      PROPOSAL_UPDATED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      STATUS_CHANGED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      COMMENT_ADDED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      COLLABORATOR_ADDED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      REVIEWER_ASSIGNED: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    };
    return iconMap[action] || (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  function getActivityTitle(action) {
    const titleMap = {
      PROPOSAL_CREATED: 'Created Proposal',
      PROPOSAL_SUBMITTED: 'Submitted Proposal',
      PROPOSAL_UPDATED: 'Updated Proposal',
      PROPOSAL_DELETED: 'Deleted Proposal',
      STATUS_CHANGED: 'Status Changed',
      COMMENT_ADDED: 'Added Comment',
      COMMENT_RESOLVED: 'Resolved Comment',
      COLLABORATOR_ADDED: 'Added Collaborator',
      REVIEWER_ASSIGNED: 'Reviewer Assigned',
      VERSION_CREATED: 'Created New Version',
      VERSION_REVERTED: 'Reverted to Previous Version',
      REPORT_SUBMITTED: 'Submitted Report',
      CLARIFICATION_REQUESTED: 'Requested Clarification',
      PROPOSAL_APPROVED: 'Proposal Approved',
      PROPOSAL_REJECTED: 'Proposal Rejected',
      USER_LOGIN: 'Logged In',
      CHAT_MESSAGE_SENT: 'Sent Chat Message'
    };
    return titleMap[action] || action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatActivityDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}