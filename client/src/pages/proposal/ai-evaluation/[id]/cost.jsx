import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CostDetail() {
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
        console.log('Full API Response:', result);
        
        const reportData = result.data?.reportData || result.reportData || result;
        console.log('Report Data:', reportData);
        
        const results = reportData?.results || [];
        console.log('Results Array:', results);
        
        const procResult = results.find(r => {
          const endpoint = r.endpoint?.toString() || '';
          return endpoint.includes('process') || endpoint.includes('estimate');
        });
        console.log('Process Result:', procResult);
        
        const procOutput = procResult?.output || {};
        console.log('Process Output:', procOutput);
        
        const costData = procOutput.cost_estimation || procOutput;
        console.log('Cost Data:', costData);
        
        if (Object.keys(costData).length === 0) {
          setError('No cost estimation data available');
        } else {
          setData(costData);
        }
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
          <p className="text-slate-600">Loading Cost Analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-5">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
          <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Error Loading Data</h2>
          <p className="text-slate-600 mb-4 text-center">{error || 'No data available'}</p>
          <div className="text-left mb-4">
            <p className="text-sm text-slate-500 mb-2">Debug Info:</p>
            <div className="bg-slate-100 p-3 rounded text-xs">
              <p><strong>ID:</strong> {id || 'Not found'}</p>
              <p><strong>Data:</strong> {data ? 'Has data but empty' : 'No data'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#003366]"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const govtBudget = data?.government_budget_lakhs || data?.government_budget || 0;
  const confidenceScore = data?.confidence_score || 0;
  const breakdown = data?.breakdown || {};
  const validation = data?.st_guidelines_validation || {};
  const categoryValidations = validation?.category_validations || {};

  console.log('Rendering with:', {
    govtBudget,
    confidenceScore,
    breakdown,
    validation,
    categoryValidations
  });

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
              <h1 className="text-3xl font-black text-[#002855] mb-2">Cost Estimation & Validation</h1>
              <p className="text-slate-600">Detailed budget analysis and S&T guidelines compliance</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-[#ff9933] to-[#e67e22] text-white rounded-lg p-6 shadow-lg">
                <div className="text-4xl font-black mb-2">₹{govtBudget}</div>
                <p className="text-sm font-semibold">Lakhs</p>
                <p className="text-xs opacity-90 mt-1">Estimated Budget</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-[#002855] mb-3">Confidence Level</h3>
            <div className="flex items-center gap-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-2xl ${
                confidenceScore >= 80 ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' :
                confidenceScore >= 60 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' :
                'bg-gradient-to-br from-[#ff9933] to-[#e67e22] text-white'
              }`}>
                {confidenceScore}%
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-700">{data.confidence_level?.toUpperCase() || 'MEDIUM'}</p>
                <p className="text-sm text-slate-500 mt-1">Estimation Reliability</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-[#002855] mb-3">Estimation Method</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <p className="font-semibold text-slate-700">{data.estimation_method?.replace('_', ' ').toUpperCase() || 'CONTENT ANALYSIS'}</p>
                <p className="text-sm text-slate-500">Analysis Approach</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">💰 Budget Breakdown by Category</h2>
            <div className="space-y-3">
              {Object.entries(breakdown).map(([category, amount]) => {
                // Safely convert amount to number
                const amountNum = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
                const percentage = govtBudget > 0 ? (amountNum / govtBudget * 100) : 0;
                return (
                  <div key={category} className="border-b border-slate-200 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-700">{category.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="font-bold text-[#002855]">₹{amountNum.toLocaleString()} Lakhs</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total budget</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Comments */}
        {data.comment && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">📝 Cost Justification Analysis</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.comment}</p>
            </div>
          </div>
        )}

        {/* S&T Guidelines Validation */}
        {Object.keys(categoryValidations).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">✅ S&T Guidelines Compliance</h2>
            <div className="space-y-4">
              {Object.entries(categoryValidations).map(([category, validation]) => {
                // Safely handle validation data
                const validationObj = typeof validation === 'object' ? validation : {};
                const isCompliant = validationObj.compliance === 'Yes' || validationObj.compliance === 'Within Limit';
                const isFlagged = validationObj.compliance === 'Exceeds Limit' || validationObj.compliance === 'No';
                
                return (
                  <div 
                    key={category}
                    className={`border-l-4 p-4 rounded ${
                      isCompliant ? 'bg-green-50 border-green-500' :
                      isFlagged ? 'bg-red-50 border-red-500' :
                      'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{category.replace(/_/g, ' ').toUpperCase()}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isCompliant ? 'bg-green-600 text-white' :
                        isFlagged ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {validationObj.compliance || 'N/A'}
                      </span>
                    </div>
                    {validationObj.value !== undefined && validationObj.value !== null && (
                      <p className="text-sm text-slate-700 mb-1">
                        <strong>Amount:</strong> ₹{String(validationObj.value)} Lakhs
                      </p>
                    )}
                    {validationObj.max_allowed !== undefined && validationObj.max_allowed !== null && (
                      <p className="text-sm text-slate-700 mb-1">
                        <strong>Max Allowed:</strong> ₹{String(validationObj.max_allowed)} Lakhs
                      </p>
                    )}
                    {validationObj.declared_total !== undefined && validationObj.declared_total !== null && (
                      <p className="text-sm text-slate-700 mb-1">
                        <strong>Declared Total:</strong> ₹{String(validationObj.declared_total)}L | <strong>Computed Sum:</strong> ₹{String(validationObj.computed_sum || 0)}L
                      </p>
                    )}
                    {validationObj.comments && Array.isArray(validationObj.comments) && validationObj.comments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {validationObj.comments.map((comment, idx) => {
                          const commentText = typeof comment === 'string' ? comment : JSON.stringify(comment);
                          return (
                            <p key={idx} className="text-xs text-slate-600">• {commentText}</p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#002855] mb-4">💡 Recommendations</h2>
            <ul className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{rec}</span>
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
