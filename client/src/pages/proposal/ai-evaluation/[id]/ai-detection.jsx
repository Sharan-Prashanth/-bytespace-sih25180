import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AIDetectionDetail() {
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
        const aiOutput = results.find(r => r.endpoint?.includes('detect-ai'))?.output || {};
        setData(aiOutput);
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
          <p className="text-slate-600">Loading AI Detection Analysis...</p>
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

  const score = data.model_score_pct || data.model_score || 0;
  const flaggedLines = data.flagged_lines || [];
  const comments = data.comments || data.improvement_comment || 'No comments available';

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
              <h1 className="text-3xl font-black text-[#002855] mb-2">AI Detection Analysis</h1>
              <p className="text-slate-600">Detailed analysis of AI-generated content detection</p>
            </div>
            <div className="text-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center font-black text-3xl ${
                score >= 80 ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' :
                score >= 50 ? 'bg-gradient-to-br from-[#ff9933] to-[#e67e22] text-white' :
                'bg-gradient-to-br from-red-500 to-red-700 text-white'
              }`}>
                {Math.round(score)}%
              </div>
              <p className="text-sm text-slate-600 mt-2 font-semibold">Human-Authored Score</p>
            </div>
          </div>
        </div>

        {/* Score Interpretation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">Score Interpretation</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 80 ? 'bg-[#138808]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">80-100%:</span> Document appears human-authored with high confidence
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score >= 50 && score < 80 ? 'bg-[#ff9933]' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">50-79%:</span> Mixed authorship or moderate AI detection
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${score < 50 ? 'bg-red-500' : 'bg-slate-300'}`}></div>
              <div>
                <span className="font-semibold">0-49%:</span> High likelihood of AI-generated content
              </div>
            </div>
          </div>
        </div>

        {/* Comments & Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">Analysis Comments</h2>
          <div className="prose max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{comments}</p>
          </div>
        </div>

        {/* Flagged Lines */}
        {flaggedLines && flaggedLines.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">Flagged Content</h2>
            <p className="text-slate-600 mb-4">The following sections were flagged for potential AI generation:</p>
            <div className="space-y-3">
              {flaggedLines.map((line, idx) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 italic">"{line.text || line}"</p>
                      {line.reason && (
                        <p className="text-xs text-red-600 mt-2">
                          <strong>Reason:</strong> {line.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {data.improvement_comment && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">💡 Improvement Suggestions</h2>
            <p className="text-slate-700 leading-relaxed">{data.improvement_comment}</p>
          </div>
        )}

        {/* Raw Data (Collapsible) */}
        <details className="bg-slate-100 rounded-lg shadow p-4 mt-6">
          <summary className="font-bold text-slate-700 cursor-pointer">View Raw JSON Data</summary>
          <pre className="mt-4 p-4 bg-slate-800 text-green-400 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
