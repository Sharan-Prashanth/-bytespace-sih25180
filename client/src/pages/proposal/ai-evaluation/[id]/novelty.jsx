import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NoveltyDetail() {
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
        const noveltyOutput = results.find(r => r.endpoint?.includes('novelty'))?.output || {};
        setData(noveltyOutput);
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
          <p className="text-slate-600">Loading Novelty Analysis...</p>
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

  const noveltyScore = data.novelty_percentage || 0;
  const uniquenessScore = data.uniqueness_score || 0;
  const advantageScore = data.advantage_score || 0;
  const significanceScore = data.significance_score || 0;
  const citationsGlobal = data.citations_global || [];
  const citationsInternal = data.citations_internal || [];
  const scamperAnalysis = data.scamper_analysis || {};

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
              <h1 className="text-3xl font-black text-[#002855] mb-2">Novelty & Innovation Analysis</h1>
              <p className="text-slate-600">Comprehensive assessment of research originality and innovation</p>
            </div>
            <div className="text-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center font-black text-3xl ${
                noveltyScore >= 80 ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' :
                noveltyScore >= 60 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' :
                noveltyScore >= 40 ? 'bg-gradient-to-br from-[#ff9933] to-[#e67e22] text-white' :
                'bg-gradient-to-br from-red-500 to-red-700 text-white'
              }`}>
                {Math.round(noveltyScore)}%
              </div>
              <p className="text-sm text-slate-600 mt-2 font-semibold">Novelty Score</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-black text-blue-600 mb-2">{Math.round(uniquenessScore)}%</div>
              <p className="text-sm text-slate-600 font-semibold">Uniqueness</p>
              <p className="text-xs text-slate-500 mt-2">How original is the idea compared to existing work</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">{Math.round(advantageScore)}%</div>
              <p className="text-sm text-slate-600 font-semibold">Advantage</p>
              <p className="text-xs text-slate-500 mt-2">Competitive edge over existing solutions</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">{Math.round(significanceScore)}%</div>
              <p className="text-sm text-slate-600 font-semibold">Significance</p>
              <p className="text-xs text-slate-500 mt-2">Impact potential in the field</p>
            </div>
          </div>
        </div>

        {/* Analysis Comments */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#002855] mb-4">Expert Analysis</h2>
          <div className="space-y-4">
            {data.llm_comment && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">💡 AI Expert Commentary</p>
                <p className="text-slate-700 leading-relaxed">{data.llm_comment}</p>
              </div>
            )}
            {data.comment && (
              <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded">
                <p className="font-semibold text-slate-900 mb-2">📊 Technical Summary</p>
                <p className="text-slate-700 leading-relaxed">{data.comment}</p>
              </div>
            )}
            {data.explanation && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="font-semibold text-green-900 mb-2">🔍 Detailed Explanation</p>
                <p className="text-slate-700 leading-relaxed">{data.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* SCAMPER Analysis */}
        {scamperAnalysis.performed && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">SCAMPER Innovation Framework</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Innovation Elements Detected:</span>
                <span className="font-bold text-2xl text-[#138808]">
                  {scamperAnalysis.elements_count || 0}/7
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#138808] to-[#0e6b06] h-3 rounded-full transition-all"
                  style={{ width: `${((scamperAnalysis.elements_count || 0) / 7) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Substitute', 'Combine', 'Adapt', 'Modify', 'Put to Other Use', 'Eliminate', 'Reverse'].map((element) => {
                const isPresent = scamperAnalysis.elements_detected?.includes(element);
                return (
                  <div 
                    key={element}
                    className={`p-3 rounded-lg border-2 ${
                      isPresent ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl ${isPresent ? 'text-green-600' : 'text-slate-400'}`}>
                        {isPresent ? '✓' : '○'}
                      </span>
                      <span className={`text-sm font-semibold ${isPresent ? 'text-green-900' : 'text-slate-500'}`}>
                        {element}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Citations */}
        {citationsGlobal.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">
              📚 Global Research Citations ({citationsGlobal.length})
            </h2>
            <div className="space-y-4">
              {citationsGlobal.map((citation, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-slate-800 flex-1">{citation.title}</h3>
                    {citation.year && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {citation.year}
                      </span>
                    )}
                  </div>
                  {(citation.similarity !== undefined || citation.uniqueness !== undefined) && (
                    <div className="flex gap-4 mb-2 text-sm">
                      {citation.similarity !== undefined && (
                        <span className="text-slate-700">
                          <strong>Similarity:</strong> {Math.round(citation.similarity > 1 ? citation.similarity : citation.similarity * 100)}%
                        </span>
                      )}
                      {citation.uniqueness !== undefined && (
                        <span className="text-green-700">
                          <strong>Uniqueness:</strong> {Math.round(citation.uniqueness > 1 ? citation.uniqueness : citation.uniqueness * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                  {citation.snippet && (
                    <p className="text-sm text-slate-600 italic mb-2">"{citation.snippet}"</p>
                  )}
                  {citation.url && (
                    <a 
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {citation.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📋 Recommended Actions</h2>
            <ul className="space-y-2">
              {data.recommended_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
