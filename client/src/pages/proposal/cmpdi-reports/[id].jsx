import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingScreen from '../../../components/LoadingScreen';
import apiClient from '../../../utils/api';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

function CMPDIReportsPage() {
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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">CMPDI Reports: {proposal.title}</h1>
          <p className="text-slate-600 mb-8">
            This page is under construction. CMPDI evaluation reports and expert comments will be listed here.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">CMPDI Summary</h3>
              </div>
              <p className="text-slate-600 text-sm">
                {proposal.cmpdiSummary || "No summary available yet."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CMPDIReports() {
  return (
    <ProtectedRoute>
      <CMPDIReportsPage />
    </ProtectedRoute>
  );
}
