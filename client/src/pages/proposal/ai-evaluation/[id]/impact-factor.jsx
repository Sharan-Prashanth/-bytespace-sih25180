import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BenefitDetail() {
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
        const benefitOutput = results.find(r => r.endpoint?.includes('benefit'))?.output || {};
        setData(benefitOutput);
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
          <p className="text-slate-600">Loading Impact Factor Analysis...</p>
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

  const score = data.benefit_score || 0;
  const meta = data.meta || {};
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
              <h1 className="text-3xl font-black text-[#002855] mb-2">Impact Factor to Coal Industry</h1>
              <p className="text-slate-600">Assessment of project benefits to Ministry of Coal priorities</p>
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
              <p className="text-sm text-slate-600 mt-2 font-semibold">Benefit Score</p>
            </div>
          </div>
        </div>

        {/* Analysis Comments */}
        {data.comments && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📊 Benefit Analysis</h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.comments}</p>
            </div>
          </div>
        )}

        {/* Keyword Matches */}
        {meta.keyword_matches && Object.keys(meta.keyword_matches).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">🔍 Ministry of Coal Priority Areas Matched</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(meta.keyword_matches).map(([area, matches]) => {
                const matchCount = Array.isArray(matches) ? matches.length : 0;
                return (
                  <div 
                    key={area}
                    className={`border-2 rounded-lg p-4 ${
                      matchCount > 0 ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{area.replace(/_/g, ' ').toUpperCase()}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        matchCount > 0 ? 'bg-green-600 text-white' : 'bg-slate-400 text-white'
                      }`}>
                        {matchCount > 0 ? `✓ ${matchCount} matches` : 'Not Found'}
                      </span>
                    </div>
                    {matchCount > 0 && Array.isArray(matches) && (
                      <div className="space-y-1 mt-2">
                        {matches.map((match, idx) => (
                          <p key={idx} className="text-xs text-slate-600">• {match}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Statistics */}
        {meta.total_keyword_matches !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-green-600 mb-2">{meta.total_keyword_matches || 0}</div>
                <p className="text-sm text-slate-600 font-semibold">Total Keywords Matched</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-blue-600 mb-2">
                  {Object.keys(meta.keyword_matches || {}).filter(area => {
                    const matches = meta.keyword_matches[area];
                    return Array.isArray(matches) && matches.length > 0;
                  }).length}
                </div>
                <p className="text-sm text-slate-600 font-semibold">Priority Areas Covered</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-4xl font-black text-purple-600 mb-2">
                  {Math.round((Object.keys(meta.keyword_matches || {}).filter(area => {
                    const matches = meta.keyword_matches[area];
                    return Array.isArray(matches) && matches.length > 0;
                  }).length / Object.keys(meta.keyword_matches || {}).length) * 100)}%
                </div>
                <p className="text-sm text-slate-600 font-semibold">Coverage Rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Flagged Areas */}
        {flaggedLines && flaggedLines.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">⚠️ Areas Needing Attention</h2>
            <div className="space-y-3">
              {flaggedLines.map((line, idx) => (
                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-sm text-slate-700">{line.text || line}</p>
                  {line.reason && (
                    <p className="text-xs text-yellow-700 mt-2">
                      <strong>Reason:</strong> {line.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flagged Count */}
        {data.flagged_count && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <div>
                <p className="text-3xl font-black text-yellow-600">{data.flagged_count}</p>
                <p className="text-sm text-slate-600">Areas Requiring Enhancement</p>
              </div>
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
                <span className="font-semibold">80-100%:</span> Excellent alignment with MoC priorities and clear benefit demonstration
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 60 && score < 80 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">60-79%:</span> Good alignment - Some areas could be strengthened
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 40 && score < 60 ? 'bg-[#ff9933]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">40-59%:</span> Moderate benefit - Needs clearer connection to MoC goals
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score < 40 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">0-39%:</span> Limited benefit demonstration - Major gaps in MoC priority alignment
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
