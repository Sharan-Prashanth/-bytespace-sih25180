import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DeliverablesDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && id) {
      fetchData();
    }
  }, [router.isReady, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/proposals/${id}/ai-evaluation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const reportData = result.data?.reportData || result.reportData;
        const results = reportData?.results || [];
        const delivOutput = results.find(r => r.endpoint?.includes('deliverable'))?.output || {};
        setData(delivOutput);
      } else {
        setError('Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#002855] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Deliverables Analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-5">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#003366]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const score = data.score || data.deliverable_percentage || 0;
  const changeablePercent = data.changeable_percentage || 0;
  const decision = data.analysis?.decision || 'Unknown';
  const totalMonths = data.analysis?.total_months || 0;
  const durationBreakdown = data.analysis?.duration_breakdown || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold"
          >
            ← Back to Report
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#002855] mb-2">Deliverables & Timeline Assessment</h1>
              <p className="text-slate-600">Evaluation of project completion feasibility within requested timeframe</p>
            </div>
            <div className="text-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center font-black text-3xl ${
                score >= 80 ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' :
                score >= 60 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' :
                score >= 40 ? 'bg-gradient-to-br from-[#ff9933] to-[#e67e22] text-white' :
                'bg-gradient-to-br from-red-500 to-red-700 text-white'
              }`}>
                {Math.round(score)}%
              </div>
              <p className="text-sm text-slate-600 mt-2 font-semibold">Deliverable Score</p>
            </div>
          </div>
        </div>

        {/* Timeline Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-black text-blue-600 mb-2">{totalMonths}</div>
              <p className="text-sm text-slate-600 font-semibold">Total Months</p>
              <p className="text-xs text-slate-500 mt-2">Estimated project duration</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className={`text-4xl mb-2 ${
                decision === 'Yes' ? 'text-green-600' : 'text-red-600'
              }`}>
                {decision === 'Yes' ? '✅' : '❌'}
              </div>
              <p className="text-sm text-slate-600 font-semibold">Completion Feasible</p>
              <p className={`text-xs mt-2 font-bold ${
                decision === 'Yes' ? 'text-green-600' : 'text-red-600'
              }`}>
                {decision}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">{changeablePercent}%</div>
              <p className="text-sm text-slate-600 font-semibold">Changeable</p>
              <p className="text-xs text-slate-500 mt-2">Improvement potential</p>
            </div>
          </div>
        </div>

        {/* Analysis Comments */}
        {data.comment && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📊 Timeline Analysis</h2>
            <div className={`border-l-4 p-4 rounded ${
              decision === 'Yes' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.comment}</p>
            </div>
          </div>
        )}

        {data.comments && data.comments !== data.comment && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">💬 Additional Comments</h2>
            <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.comments}</p>
            </div>
          </div>
        )}

        {/* Duration Breakdown */}
        {durationBreakdown && durationBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📅 Project Phase Breakdown</h2>
            <div className="space-y-4">
              {durationBreakdown.map((phase, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800">{phase.phase || phase.name || `Phase ${idx + 1}`}</h3>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {phase.duration || phase.months} months
                    </span>
                  </div>
                  {phase.description && (
                    <p className="text-sm text-slate-600 mb-2">{phase.description}</p>
                  )}
                  {phase.deliverables && Array.isArray(phase.deliverables) && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Deliverables:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {phase.deliverables.map((deliverable, dIdx) => (
                          <li key={dIdx} className="text-xs text-slate-600">{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Analysis */}
        {data.analysis?.form_analysis && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📋 Form Data Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.analysis.form_analysis).map(([key, value]) => (
                <div key={key} className="bg-slate-50 p-3 rounded">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {value !== null && value !== undefined ? String(value) : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Summary */}
        {data.analysis?.budget_summary && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">💰 Budget Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.analysis.budget_summary).map(([key, value]) => (
                <div key={key} className="bg-green-50 border border-green-200 p-4 rounded">
                  <p className="text-xs text-green-700 uppercase tracking-wide mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {typeof value === 'number' ? `₹${value} Lakhs` : value || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Interpretation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">📈 Score Interpretation</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 80 ? 'bg-[#138808]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">80-100%:</span> Realistic timeline with clear deliverables and achievable milestones
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 60 && score < 80 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">60-79%:</span> Generally feasible but may need timeline adjustments or resource additions
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 40 && score < 60 ? 'bg-[#ff9933]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">40-59%:</span> Challenging timeline - Requires scope reduction or resource increase
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score < 40 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">0-39%:</span> Unrealistic timeline - Major rescoping or extension needed
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">💡 Recommendations</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <span className="text-slate-700">Review project phases and consider parallel execution where possible</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <span className="text-slate-700">Ensure adequate manpower and equipment allocation for critical phases</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
              <span className="text-slate-700">Define clear acceptance criteria for each deliverable tranche</span>
            </li>
          </ul>
        </div>

        {/* Raw Data */}
        <details className="bg-slate-100 rounded-lg shadow p-4">
          <summary className="font-bold text-slate-700 cursor-pointer">View Raw JSON Data</summary>
          <pre className="mt-4 p-4 bg-slate-800 text-green-400 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
