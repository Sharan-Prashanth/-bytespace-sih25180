import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import apiClient from '../../../utils/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TSSRCReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchProposal();
    } else if (id === 'undefined') {
      setLoading(false);
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      const response = await apiClient.get(`/api/proposals/${id}`);
      setProposal(response.data.data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!proposal) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Proposal Not Found</h2>
        <p className="text-slate-600 mb-6">The proposal you are looking for could not be found or the ID is invalid.</p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">TSSRC Review: {proposal.title}</h1>
          <p className="text-slate-600 mb-8">
            This page is under construction. The TSSRC Review interface will be implemented here.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-2">Proposal Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">ID</span>
                <span className="text-slate-900 font-medium">{proposal.proposalCode || proposal.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Principal Investigator</span>
                <span className="text-slate-900 font-medium">{proposal.principalInvestigator}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className="text-slate-900 font-medium">{proposal.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TSSRCReview() {
  return (
    <ProtectedRoute>
      <TSSRCReviewPage />
    </ProtectedRoute>
  );
}
