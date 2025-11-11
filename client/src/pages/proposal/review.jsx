import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ROLES } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import { getProposalUrl } from "../../utils/api";

function ReviewProposalContent() {
  const router = useRouter();
  const { id } = router.query;
  const [proposal, setProposal] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [staffMembers] = useState([
    { id: 1, name: "Dr. John Smith", expertise: "AI/ML" },
    { id: 2, name: "Dr. Jane Doe", expertise: "Healthcare Tech" },
    { id: 3, name: "Prof. Bob Wilson", expertise: "Energy Systems" },
  ]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [reviewStatus, setReviewStatus] = useState("under_review");

  useEffect(() => {
    if (id) {
      // Mock proposal data - replace with API call
      setProposal({
        id: id,
        title: "AI-Powered Healthcare Diagnostic System",
        author: "Dr. Jane Smith",
        description: "A comprehensive AI system for medical diagnosis using machine learning algorithms and medical imaging.",
        domain: "Healthcare AI",
        budget: "₹25,00,000",
        status: "Under Review",
        submittedDate: "2024-01-15",
        existingFeedback: [
          { 
            id: 1, 
            reviewer: "Dr. Admin", 
            comment: "Initial review looks promising. Need more details on data privacy.", 
            date: "2024-01-16",
            type: "feedback"
          }
        ]
      });
    }
  }, [id]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getProposalUrl(id, 'feedback'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ feedback, type: "reviewer_feedback" })
      });

      if (response.ok) {
        alert("Feedback submitted successfully!");
        setFeedback("");
        // Refresh proposal data
      } else {
        alert("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback");
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getProposalUrl(id, 'assign'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ staffId: selectedStaff })
      });

      if (response.ok) {
        alert("Staff assigned successfully!");
        setSelectedStaff("");
      } else {
        alert("Failed to assign staff");
      }
    } catch (error) {
      console.error("Error assigning staff:", error);
      alert("Error assigning staff");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getProposalUrl(id, 'status'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert("Status updated successfully!");
        setReviewStatus(newStatus);
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    }
  };

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading proposal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-purple-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-indigo-400 rounded-full blur-2xl opacity-20 animate-pulse animation-delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-purple-200">Proposal Review</span>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse animation-delay-500"></div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">Review Proposal</h1>
              <p className="text-slate-200 text-lg font-light animate-fade-in-up animation-delay-200">Evaluate and provide feedback on research proposals</p>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mt-6 animate-scale-x"></div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2 animate-fade-in-up animation-delay-400"
            >
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">

          {/* Proposal Details */}
                    {/* Proposal Details Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-600">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              <h2 className="text-3xl font-bold text-slate-900">{proposal.title}</h2>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse animation-delay-500"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Author</p>
                    <p className="font-semibold text-slate-900">{proposal.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Domain</p>
                    <p className="font-semibold text-slate-900">{proposal.domain}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Budget</p>
                    <p className="font-semibold text-slate-900">{proposal.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Submitted</p>
                    <p className="font-semibold text-slate-900">{proposal.submittedDate}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <p className="text-slate-700 font-semibold">Description</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <p className="text-slate-700 leading-relaxed">{proposal.description}</p>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feedback Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Submit Feedback</h3>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter detailed feedback for the author regarding methodology, feasibility, innovation, and recommendations..."
                className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-black bg-white font-medium transition-all duration-300 hover:border-slate-400 resize-none"
                rows="6"
                style={{ color: 'black' }}
              />
              <button
                onClick={handleSubmitFeedback}
                className="w-full mt-4 group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Feedback
              </button>
            </div>

            {/* Staff Assignment Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-1000">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Assign Research Staff</h3>
              </div>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-black bg-white font-medium transition-all duration-300 hover:border-slate-400 mb-4"
                style={{ color: 'black' }}
              >
                <option value="" style={{ color: 'black' }}>Select a staff member</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id} style={{ color: 'black' }}>
                    {staff.name} - {staff.expertise}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignStaff}
                className="w-full group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Assign Staff
              </button>
            </div>
          </div>

          {/* Status Update Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mb-8 animate-fade-in-up animation-delay-1200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Update Review Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleUpdateStatus("approved")}
                className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus("rejected")}
                className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:animate-shake" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus("needs_revision")}
                className="group bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Request Revision
              </button>
            </div>
          </div>

          {/* Previous Feedback */}
          {proposal.existingFeedback && proposal.existingFeedback.length > 0 && (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fade-in-up animation-delay-1400">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Previous Feedback</h3>
              </div>
              <div className="space-y-6">
                {proposal.existingFeedback.map((item, index) => (
                  <div
                    key={index}
                    className="group p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{item.reviewer.charAt(0)}</span>
                        </div>
                        <p className="font-bold text-slate-900">{item.reviewer}</p>
                      </div>
                      <p className="text-sm text-slate-500 bg-slate-200 px-3 py-1 rounded-full">{item.date}</p>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-13">{item.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ReviewProposal() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.REVIEWER]}>
      <ReviewProposalContent />
    </ProtectedRoute>
  );
}
