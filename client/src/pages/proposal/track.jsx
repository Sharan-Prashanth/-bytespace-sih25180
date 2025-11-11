import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import dynamic from 'next/dynamic';
import { getProposalUrl } from "../../utils/api";

// Dynamically import TimelineChart to avoid SSR issues
const TimelineChart = dynamic(() => import("../../components/TimelineChart"), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-100 rounded-lg animate-pulse"></div>
});

function TrackProposalContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getProposalUrl(id), {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProposal(data);
      } else {
        // Mock data for demonstration
        setProposal({
          id: id,
          title: "AI-Powered Healthcare Diagnosis System",
          status: "under_review",
          author: user?.name || "John Researcher",
          createdAt: "2025-09-20",
          timeline: {
            submitted: "2025-09-20",
            reviewStarted: "2025-09-21",
            staffAssigned: "2025-09-22"
          }
        });
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusUpdates = () => [
    { status: "Submitted", completed: true, date: proposal?.timeline?.submitted || "2025-09-20" },
    { status: "Under AI Evaluation", completed: true, date: proposal?.timeline?.reviewStarted || "2025-09-21" },
    { status: "Assigned for Review", completed: !!proposal?.timeline?.staffAssigned, date: proposal?.timeline?.staffAssigned || null },
    { status: "Staff Analysis", completed: false, date: null },
    { status: "Final Decision", completed: false, date: null },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-600">Loading proposal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 via-transparent to-cyan-800/90"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-40 -left-20 w-60 h-60 bg-cyan-300/10 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute -bottom-20 right-20 w-40 h-40 bg-teal-300/10 rounded-full animate-float animation-delay-2000"></div>
        </div>

        <nav className="relative z-10 px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">NaCCER Portal</h1>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="group flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all duration-300 hover:scale-105 print:hidden"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              Track Your 
              <span className="block bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Proposal
              </span>
            </h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Monitor the progress of your research proposal through our comprehensive review process
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Proposal Details Card */}
        {proposal && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mb-8 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{proposal.title}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-semibold capitalize">
                    {proposal.status?.replace('_', ' ')}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                    Author: {proposal.author}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                    Submitted: {proposal.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tracking Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Status Updates Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Status Updates</h3>
            </div>
            <div className="space-y-6">
              {getStatusUpdates().map((update, index) => (
                <div key={index} className="group flex items-center gap-6 p-4 rounded-xl hover:bg-slate-50 transition-all duration-300">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    update.completed 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {update.completed ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                    {!update.completed && index > 0 && getStatusUpdates()[index - 1].completed && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl animate-pulse opacity-20"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-lg transition-colors duration-300 ${
                      update.completed ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                      {update.status}
                    </div>
                    {update.date && (
                      <div className="text-sm text-slate-600 mt-1 bg-slate-100 inline-block px-3 py-1 rounded-full">
                        {update.date}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {update.completed ? (
                      <div className="text-green-500 text-2xl animate-bounce">✅</div>
                    ) : (
                      <div className="text-yellow-500 text-2xl animate-pulse">⏳</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Chart Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-800">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Progress Timeline</h3>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
              <TimelineChart proposalData={proposal} />
            </div>
          </div>
        </div>
      </main>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-gradient-to-br,
          .bg-gradient-to-r {
            background: white !important;
            color: black !important;
          }
          
          .text-white {
            color: black !important;
          }
          
          .shadow-xl,
          .shadow-lg {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          
          * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export default function TrackProposal() {
  return (
    <ProtectedRoute>
      <TrackProposalContent />
    </ProtectedRoute>
  );
}
