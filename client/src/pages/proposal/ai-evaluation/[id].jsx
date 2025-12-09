import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FileCheck, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export default function AIEvaluationReport() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [evaluationReports, setEvaluationReports] = useState([]);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (id) {
      fetchProposalData();
    }
  }, [id]);

  const fetchProposalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProposal(data);
        
        // Extract validation reports
        const validationReports = data.aiReports?.filter(
          report => report.reportType === 'validation'
        ) || [];
        
        if (validationReports.length > 0) {
          const latestValidation = validationReports[validationReports.length - 1];
          setValidationReport(latestValidation);
        }
        
        // Extract evaluation reports
        const evalReports = data.aiReports?.filter(
          report => report.reportType === 'evaluation'
        ) || [];
        
        setEvaluationReports(evalReports);
      } else {
        setError('Failed to load proposal data');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setError('Failed to load proposal data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderJSON = (data, parentKey = '') => {
    if (data === null || data === undefined) {
      return <span className="text-black">null</span>;
    }

    if (typeof data !== 'object') {
      return <span className="text-black">{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-black">[]</span>;
      }
      return (
        <div className="ml-4 border-l-2 border-indigo-200 pl-4">
          {data.map((item, index) => (
            <div key={index} className="mb-2">
              <span className="text-black font-medium">[{index}]:</span>
              <div className="ml-4">{renderJSON(item, `${parentKey}[${index}]`)}</div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="ml-4 space-y-2">
        {Object.entries(data).map(([key, value]) => {
          const sectionKey = `${parentKey}.${key}`;
          const isExpandable = typeof value === 'object' && value !== null;
          const isExpanded = expandedSections[sectionKey];

          return (
            <div key={key} className="border-l-2 border-indigo-200 pl-4">
              <div className="flex items-start gap-2">
                {isExpandable && (
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className="mt-1 text-indigo-600 hover:text-indigo-800"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                <div className="flex-1">
                  <span className="text-black font-semibold">{key}:</span>
                  {isExpandable ? (
                    isExpanded && <div className="mt-2">{renderJSON(value, sectionKey)}</div>
                  ) : (
                    <span className="ml-2 text-black">{String(value)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black text-lg mb-4">{error || 'Proposal not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-black">AI Reports</h1>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-black mb-4">Proposal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-black"><span className="font-medium">Title:</span> {proposal.formi?.content?.title || proposal.title || 'N/A'}</p>
                <p className="text-black"><span className="font-medium">Proposal Code:</span> {proposal.proposalCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-black"><span className="font-medium">Version:</span> {proposal.currentVersion}</p>
                <p className="text-black"><span className="font-medium">Status:</span> {proposal.status}</p>
              </div>
            </div>
          </div>

          {validationReport && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-bold text-black mb-4">AI Validation Report</h2>
              <div className="mb-4">
                <p className="text-black">
                  <span className="font-medium">Version:</span> {validationReport.version}
                </p>
                <p className="text-black">
                  <span className="font-medium">Generated At:</span> {new Date(validationReport.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-300 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-black mb-3">Report Data</h3>
                {renderJSON(validationReport.reportData, 'validation')}
              </div>
            </div>
          )}

          {evaluationReports.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">AI Evaluation Reports</h2>
              {evaluationReports.map((report, index) => (
                <div key={index} className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="text-xl font-bold text-black mb-4">
                    Evaluation Report {index + 1}
                  </h3>
                  <div className="mb-4">
                    <p className="text-black">
                      <span className="font-medium">Version:</span> {report.version}
                    </p>
                    <p className="text-black">
                      <span className="font-medium">Generated At:</span> {new Date(report.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-300 max-h-96 overflow-y-auto">
                    <h4 className="text-lg font-semibold text-black mb-3">Report Data</h4>
                    {renderJSON(report.reportData, `evaluation-${index}`)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !validationReport && (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-black text-lg">No AI reports available for this proposal yet.</p>
              </div>
            )
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
