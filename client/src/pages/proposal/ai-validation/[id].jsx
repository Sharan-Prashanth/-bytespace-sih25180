'use client';

import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
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
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const reportRef = useRef(null);

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

  if (!validationReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-black text-lg mb-4">No validation report available for this proposal yet.</p>
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

  const valRes = validationReport.validation_result || {};
  const extract = validationReport.extracted_data || {};
  const costs = extract.cost_breakdown || {};
  const basicInfo = extract.basic_information || {};
  const rev = costs.revenue_expenditure || {};
  const cap = costs.capital_expenditure || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .report-container { 
            box-shadow: none !important; 
            margin: 0 !important;
            max-width: none !important;
          }
        }
        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>

      <div className="min-h-screen bg-[#555] p-5">
        {/* Debug Toggle Button */}
        <button
          onClick={() => setShowJsonDebug(!showJsonDebug)}
          className="no-print fixed top-4 left-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 z-50 text-sm"
        >
          {showJsonDebug ? 'Hide' : 'Show'} JSON Debug
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="no-print fixed bottom-5 right-5 px-6 py-4 bg-[#002855] text-white rounded-full font-bold shadow-lg hover:bg-[#003366] cursor-pointer z-50"
        >
          Print Report
        </button>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="no-print fixed bottom-5 left-5 px-6 py-4 bg-slate-700 text-white rounded-full font-bold shadow-lg hover:bg-slate-800 cursor-pointer z-50"
        >
          ← Back
        </button>

        {/* JSON Debug Panel */}
        {showJsonDebug && (
          <div className="no-print max-w-[210mm] mx-auto mb-5 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-2 text-black">Debug: Validation Report JSON</h3>
            <textarea
              className="w-full h-64 p-3 font-mono text-xs border border-slate-300 rounded bg-slate-50 text-black"
              value={JSON.stringify(validationReport, null, 2)}
              readOnly
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(validationReport, null, 2));
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm"
              >
                Copy JSON
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(validationReport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `validation-report-${proposal?.proposalCode || id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm"
              >
                Download JSON
              </button>
            </div>
          </div>
        )}

        {/* Report Container */}
        <div ref={reportRef} className="report-container max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] relative shadow-lg border-t-[5px] border-t-[#ff9933] border-b-[5px] border-b-[#138808]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-5 border-b border-gray-300 pb-4">
            <div className="flex gap-3 items-center">
              <div className="font-bold text-xl text-[#ff9933]">MoC</div>
              <div>
                <h1 className="text-2xl text-[#002855] m-0 uppercase font-bold">Ministry of Coal</h1>
                <div className="text-xs text-[#002855]">Science & Technology Grant Evaluation</div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className={`font-bold ${valRes.overall_validation ? 'text-green-600' : 'text-[#d81b60]'}`}>
                STATUS: {valRes.overall_validation ? 'APPROVED' : 'REVISION REQUIRED'}
              </div>
            </div>
          </div>

          {/* Section 1: Project & Financial Overview */}
          <div className="mb-6">
            <h2 className="text-lg text-[#002855] border-b-2 border-[#ff9933] pb-1 mt-6 mb-4">1. Project & Financial Overview</h2>
            <table className="w-full border-collapse text-xs mb-4">
              <tbody>
                <tr>
                  <th className="bg-[#fff3e6] text-left p-2 border border-[#002855] text-black w-1/4">Project Title</th>
                  <td className="border border-[#002855] p-2 font-bold text-black" colSpan={3}>{basicInfo.project_title || '--'}</td>
                </tr>
                <tr>
                  <th className="bg-[#fff3e6] text-left p-2 border border-[#002855] text-black">Principal Investigator</th>
                  <td className="border border-[#002855] p-2 text-black">{basicInfo.project_leader_name || '--'}</td>
                  <th className="bg-[#fff3e6] text-left p-2 border border-[#002855] text-[#002855]">Agency</th>
                  <td className="border border-[#002855] p-2 text-black">{basicInfo.principal_implementing_agency || '--'}</td>
                </tr>
                <tr>
                  <th className="bg-[#fff3e6] text-left p-2 border border-[#002855] text-[#002855]">Submission Date</th>
                  <td className="border border-[#002855] p-2 text-black">{basicInfo.submission_date || '--'}</td>
                  <th className="bg-[#fff3e6] text-left p-2 border border-[#002855] text-[#002855]">Total Outlay</th>
                  <td className="border border-[#002855] p-2 text-black">₹ {costs.total_project_cost?.total || '0'} Lakhs</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-sm text-[#002855] font-bold mb-1 mt-0">Financial Breakdown (₹ Lakhs)</h3>
            <table className="w-full border-collapse text-xs mt-2">
              <thead>
                <tr>
                  <th className="bg-[#002855] text-white p-2 text-left">Category</th>
                  <th className="bg-[#002855] text-white p-2 text-right">Year 1</th>
                  <th className="bg-[#002855] text-white p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {parseFloat(rev.salaries?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Salaries / Manpower</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.salaries.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.salaries.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                {parseFloat(rev.consumables?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Consumables</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.consumables.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.consumables.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                {parseFloat(rev.travel?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Travel</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.travel.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.travel.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                {parseFloat(rev.workshop_seminar?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Workshop / Seminar</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.workshop_seminar.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(rev.workshop_seminar.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                {parseFloat(cap.equipment?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Equipment (Capital)</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(cap.equipment.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(cap.equipment.total || 0).toFixed(2)}</td>
                  </tr>
                )}
                {parseFloat(cap.land_building?.total || 0) > 0 && (
                  <tr>
                    <td className="border-b border-[#002855] p-2 text-black">Land & Building</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(cap.land_building.year1 || 0).toFixed(2)}</td>
                    <td className="border-b border-[#002855] p-2 text-right font-mono font-bold text-black">{parseFloat(cap.land_building.total || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#fff3e6] font-bold">
                  <td className="p-2 text-black">TOTAL PROJECT COST</td>
                  <td className="p-2 text-right font-mono text-black">₹ {parseFloat(costs.total_project_cost?.year1 || 0).toFixed(2)}</td>
                  <td className="p-2 text-right font-mono text-black">₹ {parseFloat(costs.total_project_cost?.total || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Section 2: Validation Faults */}
          <div className="mb-6">
            <h2 className="text-lg text-[#002855] border-b-2 border-[#ff9933] pb-1 mt-6 mb-4">2. Validation Faults (Action Required)</h2>
            <div>
              {valRes.columns_missing_value?.length > 0 && valRes.columns_missing_value.map((field, idx) => (
                <div key={idx} className="border-l-4 border-[#d81b60] bg-[#fff0f5] p-3 mb-3 text-xs">
                  <div className="font-bold text-[#d81b60] mb-1 flex justify-between">
                    <span>{field}</span>
                    <span className="px-2 py-1 rounded bg-[#d81b60] text-white text-[11px]">MISSING DATA</span>
                  </div>
                  <div className="text-black">This field is mandatory but was left empty in the submission.</div>
                </div>
              ))}
              
              {valRes.columns_not_following_guidelines?.length > 0 && valRes.columns_not_following_guidelines.map((item, idx) => (
                <div key={idx} className="border-l-4 border-[#ff9933] bg-[#fff0f5] p-3 mb-3 text-xs">
                  <div className="font-bold text-[#cc7a00] mb-1 flex justify-between">
                    <span>{item.field}</span>
                    <span className="px-2 py-1 rounded bg-[#ff9933] text-white text-[11px]">GUIDELINE ISSUE</span>
                  </div>
                  <div className="text-black">{item.reason}</div>
                </div>
              ))}

              {(!valRes.columns_missing_value || valRes.columns_missing_value.length === 0) && 
               (!valRes.columns_not_following_guidelines || valRes.columns_not_following_guidelines.length === 0) && (
                <div className="p-3 bg-[#eef8f0] border border-[#138808] text-[#138808] font-bold">
                  No validation faults detected.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Guidelines */}
          <div className="mb-6">
            <h2 className="text-lg text-[#002855] border-b-2 border-[#ff9933] pb-1 mt-6 mb-4">3. S&T Guidelines Reference</h2>
            <div className="text-xs text-black leading-relaxed bg-[#fff3e6] p-3 border border-[#ff9933] rounded">
              <p className="mt-0"><strong>Compliance Standard:</strong> This proposal was evaluated against the "Guidelines for Support to Coal S&T Projects (2025)".</p>
              <ul className="list-disc pl-5">
                <li><strong>Objectives:</strong> Must be listed as bullet points (2-5 max) and specific.</li>
                <li><strong>Work Plan:</strong> Must define clear phases and milestones.</li>
                <li><strong>Budget:</strong> Equipment and Manpower must be strictly justified.</li>
              </ul>
              <p className="mb-0"><em>Any items listed in Section 2 above indicate a direct deviation from these standards and must be corrected before the proposal can proceed to the Technical Committee.</em></p>
            </div>
          </div>

          {/* Section 4: Submitted Data */}
          <div className="mb-6">
            <h2 className="text-lg text-[#002855] border-b-2 border-[#ff9933] pb-1 mt-6 mb-4">4. Submitted Data Content</h2>
            <div className="text-[11px] text-[#002855] font-semibold mb-3">Below is the raw text extracted from the submission form.</div>
            <div>
              {valRes.fields && Array.isArray(valRes.fields) && valRes.fields.map((f, idx) => {
                let borderColor = '#eee';
                if (f.validation_result === 'not_following_guidelines') borderColor = '#ff9933';
                if (f.validation_result === 'not_filled') borderColor = '#d81b60';
                
                return (
                  <div key={idx} className="mb-4 border p-3 rounded bg-white" style={{ borderColor }}>
                    <div className="text-[11px] font-bold text-[#002855] uppercase mb-1">{f.field_name}</div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap text-black">
                      {f.value ? f.value : <em className="text-[#d81b60]">[No Data Provided]</em>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function AIValidationReport() {
  return (
    <ProtectedRoute>
      <AIValidationReportContent />
    </ProtectedRoute>
  );
}
