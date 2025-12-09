import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TechnicalFeasibilityDetail() {
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
        const feasOutput = results.find(r => r.endpoint?.includes('technical'))?.output || {};
        setData(feasOutput);
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
          <p className="text-slate-600">Loading Technical Feasibility Analysis...</p>
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

  const score = data.score || 0;
  const changeablePercent = data.changeable_percent || 0;
  const decision = data.feasibility_decision || 'Unknown';
  const flaggedLines = data.flagged_lines || [];

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
              <h1 className="text-3xl font-black text-[#002855] mb-2">Technical Feasibility Assessment</h1>
              <p className="text-slate-600">Evaluation of project execution capability and technical soundness</p>
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
              <p className="text-sm text-slate-600 mt-2 font-semibold">Feasibility Score</p>
            </div>
          </div>
        </div>

        {/* Decision & Changeability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-[#002855] mb-3">Feasibility Decision</h3>
            <div className="flex items-center gap-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${
                decision === 'Yes' ? 'bg-green-100' :
                decision === 'No' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                {decision === 'Yes' ? '✅' : decision === 'No' ? '❌' : '⚠️'}
              </div>
              <div className="flex-1">
                <p className={`text-2xl font-black ${
                  decision === 'Yes' ? 'text-green-600' :
                  decision === 'No' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {decision}
                </p>
                <p className="text-sm text-slate-500 mt-1">Final Assessment</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-[#002855] mb-3">Improvement Potential</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Changeable</span>
                  <span className="font-bold text-2xl text-blue-600">{changeablePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full transition-all"
                    style={{ width: `${changeablePercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">How much can be improved with revisions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Comments */}
        {data.comment && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📊 Detailed Analysis</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
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

        {/* Flagged Issues */}
        {flaggedLines && flaggedLines.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">
              ⚠️ Flagged Technical Issues ({flaggedLines.length})
            </h2>
            <p className="text-slate-600 mb-4">The following areas require attention or clarification:</p>
            <div className="space-y-3">
              {flaggedLines.map((line, idx) => (
                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{line.text || line}</p>
                      {line.reason && (
                        <p className="text-xs text-yellow-700 mt-2">
                          <strong>Issue:</strong> {line.reason}
                        </p>
                      )}
                      {line.suggestion && (
                        <p className="text-xs text-green-700 mt-1">
                          <strong>Suggestion:</strong> {line.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flagged Count Summary */}
        {data.flagged_count && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🚩
              </div>
              <div>
                <p className="text-3xl font-black text-red-600">{data.flagged_count}</p>
                <p className="text-sm text-slate-600">Total Issues Identified</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">✅ Recommended Actions</h2>
            <ul className="space-y-2">
              {data.recommended_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Score Interpretation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">📈 Score Interpretation</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 80 ? 'bg-[#138808]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">80-100%:</span> Highly feasible - Strong technical foundation with clear execution path
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 60 && score < 80 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">60-79%:</span> Feasible with improvements - Minor technical gaps need addressing
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 40 && score < 60 ? 'bg-[#ff9933]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">40-59%:</span> Challenging feasibility - Significant revisions required
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score < 40 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">0-39%:</span> Low feasibility - Major technical concerns or incomplete information
              </div>
            </div>
          </div>
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
