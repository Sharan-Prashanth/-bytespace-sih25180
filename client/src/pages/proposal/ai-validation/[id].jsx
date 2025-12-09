'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../utils/api';
import LoadingScreen from '../../../components/LoadingScreen';

function AIValidationReportContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && id) {
      fetchProposalAndReport();
    }
  }, [router.isReady, id]);

  const fetchProposalAndReport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/proposals/${id}`);
      const proposalData = response.data?.data || response.data;
      setProposal(proposalData);

      // Extract validation report from aiReports array
      const validationReports = proposalData.aiReports?.filter(
        report => report.reportType === 'validation'
      );
      
      if (validationReports && validationReports.length > 0) {
        // Get the latest validation report
        const latestReport = validationReports[validationReports.length - 1];
        setValidationReport(latestReport.reportData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Failed to load validation report');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-black text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // This page will be implemented by someone else
  // For now, show a placeholder with the report data structure
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-black mb-4">AI Validation Report</h1>
          <p className="text-black mb-4">Proposal Code: {proposal?.proposalCode}</p>
          
          {validationReport ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h2 className="font-bold text-black mb-2">Validation Result</h2>
                <p className="text-black">
                  Overall Validation: {validationReport.validation_result?.overall_validation ? 'PASSED' : 'FAILED'}
                </p>
              </div>
              
              {validationReport.validation_result?.columns_missing_value?.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-bold text-black mb-2">Missing Values</h3>
                  <ul className="list-disc list-inside text-black">
                    {validationReport.validation_result.columns_missing_value.map((col, idx) => (
                      <li key={idx}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationReport.validation_result?.columns_not_following_guidelines?.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-black mb-2">Not Following Guidelines</h3>
                  <ul className="list-disc list-inside text-black">
                    {validationReport.validation_result.columns_not_following_guidelines.map((col, idx) => (
                      <li key={idx}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-black">
                  <strong>Note:</strong> This is a placeholder page. The full AI validation report UI will be implemented separately.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-black">No validation report available for this proposal yet.</p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIValidationReport() {
  return (
    <ProtectedRoute>
      <AIValidationReportContent />
    </ProtectedRoute>
  );
}
