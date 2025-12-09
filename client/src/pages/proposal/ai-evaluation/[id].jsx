import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function AIEvaluationReport() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [error, setError] = useState(null);
  const [showJsonDebug, setShowJsonDebug] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (router.isReady && id) {
      fetchProposalData();
    }
  }, [router.isReady, id]);

  const fetchProposalData = async () => {
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
        const data = result.data || result;
        
        setProposal({ 
          proposalCode: data.proposalCode, 
          _id: data.proposalId
        });
        
        setEvaluationReport(data.reportData);
      } else {
        setError('Failed to load evaluation report');
      }
    } catch (error) {
      console.error('Error fetching evaluation report:', error);
      setError('Failed to load evaluation report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper functions
  const getOutput = (results, endpoint) => {
    if (!Array.isArray(results)) return {};
    const normalize = s => (s || '').toString().replace(/^\/+/, '').replace(/[-_]/g, '').toLowerCase();
    const needle = normalize(endpoint || '');
    const found = results.find(r => {
      if (!r || !r.endpoint) return false;
      const e = r.endpoint.toString();
      if (e.includes(endpoint)) return true;
      const ne = normalize(e);
      if (ne === needle) return true;
      if (ne.includes(needle) || needle.includes(ne)) return true;
      return false;
    });
    return found ? (found.output || {}) : {};
  };

  const extractPercent = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const keys = ['feasibility_percentage', 'deliverable_percentage', 'novelty_percentage', 'confidence_score', 'score', 'percentage', 'model_score_pct'];
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const v = obj[k];
        if (typeof v === 'number' && !isNaN(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v.replace(/[^0-9\\.\\-]/g, ''));
          if (!isNaN(n)) return n;
        }
      }
    }
    return null;
  };

  const parseSWOTCategory = (text, categoryMarker) => {
    if (!text) return [];
    const regex = new RegExp(categoryMarker + '[^\\n]*\\n\\n([\\s\\S]*?)(?=\\n\\n[SWOT] —|$)', 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    const content = match[1];
    const lines = content.split(/\n/).map(l => l.trim()).filter(l => l.startsWith('*') || l.startsWith('-'));
    return lines.map(l => l.replace(/^[\\*\\-]\\s*/, '').trim()).filter(Boolean);
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading evaluation report...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluationReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black text-lg mb-4">{error || 'No evaluation report available'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const results = evaluationReport.results || [];
  const ai = getOutput(results, "detect-ai-and-validate");
  const proc = getOutput(results, "process-and-estimate");
  const deliv = getOutput(results, "deliverable-check");
  const novel = getOutput(results, "analyze-novelty");
  const feas = getOutput(results, "technical-feasibility");
  const benefit = getOutput(results, "benefit-check");
  const swotData = getOutput(results, 'swot-agent') || {};
  
  const extracted = proc.extracted_json || {};
  const cost = proc.cost_estimation || {};
  const basicInfo = extracted.basic_information || {};

  // Calculate scores
  const novelPct = extractPercent(novel) ?? 0;
  const feasPct = extractPercent(feas) ?? 0;
  const costPct = extractPercent(cost) ?? 0;
  const aiScore = ai.model_score_pct || ai.model_score || 0;
  const benefitScore = benefit.benefit_score || 0;
  const delivPct = extractPercent(deliv) ?? 0;
  
  const overallScore = Math.round((novelPct + feasPct + costPct + aiScore + benefitScore + delivPct) / 6);

  // Parse SWOT
  const swotString = swotData.swot || '';
  const strengths = parseSWOTCategory(swotString, 'S —');
  const weaknesses = parseSWOTCategory(swotString, 'W —');
  const opportunities = parseSWOTCategory(swotString, 'O —');
  const threats = parseSWOTCategory(swotString, 'T —');

  // Parse SCAMPER
  const scamperData = getOutput(results, 'scamper');
  const scamperResult = scamperData.scamper_semantic_result || '';
  
  const parseSCAMPERSection = (text, sectionNum, sectionName) => {
    if (!text) return { present: 'No', explanation: '', evidence: '' };
    const regex = new RegExp(`${sectionNum}\\.\\s*\\*\\*${sectionName}\\*\\*[^*]*\\*\\s*\\*\\*Present:\\*\\*\\s*(Yes|No)[^*]*\\*\\s*\\*\\*Explanation:\\*\\*([^*]*?)\\*\\s*\\*\\*Evidence:\\*\\*([^]*?)(?=\\n\\n\\d+\\.|$)`, 'i');
    const match = text.match(regex);
    if (!match) return { present: 'No', explanation: '', evidence: '' };
    return {
      present: match[1].trim(),
      explanation: match[2].trim(),
      evidence: match[3].trim().replace(/^"|"$/g, '')
    };
  };

  const scamperSubstitute = parseSCAMPERSection(scamperResult, '1', 'Substitute');
  const scamperCombine = parseSCAMPERSection(scamperResult, '2', 'Combine');
  const scamperAdapt = parseSCAMPERSection(scamperResult, '3', 'Adapt');
  const scamperModify = parseSCAMPERSection(scamperResult, '4', 'Modify / Magnify / Minify');
  const scamperPutToUse = parseSCAMPERSection(scamperResult, '5', 'Put to Other Use');
  const scamperEliminate = parseSCAMPERSection(scamperResult, '6', 'Eliminate');
  const scamperReverse = parseSCAMPERSection(scamperResult, '7', 'Reverse / Rearrange');

  // Parse detailed validation data
  const aiFlaggedLines = ai.flagged_lines || [];
  const costValidation = cost.st_guidelines_validation || {};
  const categoryValidations = costValidation.category_validations || {};
  const novelCitationsGlobal = novel.citations_global || [];
  const novelCitationsInternal = novel.citations_internal || [];

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          
          /* Ensure bar chart backgrounds are visible when printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>

      <div className="min-h-screen bg-[#555] p-5">
        {/* Debug Toggle */}
        <button
          onClick={() => setShowJsonDebug(!showJsonDebug)}
          className="no-print fixed top-4 left-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 z-50 text-sm"
        >
          {showJsonDebug ? 'Hide Report / Show JSON' : 'Hide JSON / Show Report'}
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
        {showJsonDebug ? (
          <div className="no-print max-w-[214mm] mx-auto mb-5 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-2 text-black">Debug: Evaluation Report JSON</h3>
            <textarea
              className="w-full h-[600px] p-3 font-mono text-xs border border-slate-300 rounded bg-slate-50 text-black"
              value={JSON.stringify(evaluationReport, null, 2)}
              readOnly
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(evaluationReport, null, 2));
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm"
              >
                Copy JSON
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(evaluationReport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evaluation-report-${proposal?.proposalCode || id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 text-sm"
              >
                Download JSON
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Ministry of Coal Evaluation Report - PAGE 1 */}
            <div ref={reportRef} className="page w-[214mm] min-h-[297mm] mx-auto my-2 bg-gradient-to-b from-[#fff3e6] via-white to-[#eef8f0] p-12 relative shadow-lg border-l-4 border-l-[#ff9933] border-r-4 border-r-[#138808]">
              
              {/* Banner */}
              <div className="w-full h-[100px] bg-[#fbfbfb] border-l-4 border-l-[#ff9933] border-r-4 border-r-[#138808] rounded-md flex items-center justify-between px-5 mb-3 relative shadow-md border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="font-bold text-[20px] text-[#002855]">MoC</div>
                </div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-sm font-bold text-[#002855]">Government of India</div>
                  <div className="text-[20px] font-extrabold text-[#002855] uppercase tracking-wide">Ministry of Coal</div>
                  <div className="text-xs text-[#002855] opacity-90 mt-1">Project Evaluation Report • Confidential</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-black">Report ID: MOC-2025-{id?.slice(-4)}</div>
                  <div className="text-black mt-1">Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Project Info Table */}
              <div className="w-full border-2 border-gray-300 my-2 rounded-md overflow-hidden bg-white shadow-sm">
                <table className="w-full border-collapse text-xs bg-white">
                  <tbody>
                    <tr>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left w-[18%]">PROJECT TITLE</th>
                      <td className="p-2 text-black" colSpan={3}>{basicInfo.project_title || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">PRINCIPAL INVESTIGATOR</th>
                      <td className="p-2 border-r border-gray-300 text-black">{basicInfo.project_leader_name || '--'}</td>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">INSTITUTE</th>
                      <td className="p-2 text-black">{basicInfo.principal_implementing_agency || '--'}</td>
                    </tr>
                    <tr>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">SUBMISSION DATE</th>
                      <td className="p-2 border-r border-gray-300 text-black">{basicInfo.submission_date || '--'}</td>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">REQUESTED BUDGET</th>
                      <td className="p-2 text-black">₹ {cost.government_budget_lakhs || extracted.cost_breakdown?.total_project_cost?.total || '--'} lakhs</td>
                    </tr>
                    <tr>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">PROJECT DURATION</th>
                      <td className="p-2 border-r border-gray-300 text-black">{basicInfo.project_duration || '--'}</td>
                      <th className="bg-gradient-to-r from-gray-100 to-white p-2 border-r border-gray-300 font-bold text-[11px] text-[#002855] text-left">PROPOSAL ID</th>
                      <td className="p-2 text-black">{proposal?.proposalCode || '--'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 my-2">
                <div className="bg-white border-2 border-gray-300 p-3 rounded-md shadow-sm text-center text-xs">
                  <div className="text-lg font-extrabold text-[#002855]">{overallScore}%</div>
                  <div className="text-[11px] text-black mt-1">Overall Score</div>
                </div>
                <div className="bg-white border-2 border-gray-300 p-3 rounded-md shadow-sm text-center text-xs">
                  <div className="text-lg font-extrabold text-[#002855]">{(aiScore / 100).toFixed(2)}</div>
                  <div className="text-[11px] text-black mt-1">Risk Index</div>
                </div>
                <div className="bg-white border-2 border-gray-300 p-3 rounded-md shadow-sm text-center text-xs">
                  <div className="text-lg font-extrabold text-[#002855]">{cost.government_budget_lakhs || '--'} lak</div>
                  <div className="text-[11px] text-black mt-1">Requested Funds</div>
                </div>
                <div className="bg-white border-2 border-gray-300 p-3 rounded-md shadow-sm text-center text-xs">
                  <div className="text-lg font-extrabold text-[#002855]">{basicInfo.project_duration || '--'}</div>
                  <div className="text-[11px] text-black mt-1">Duration</div>
                </div>
              </div>

              {/* Main Content with Circles and Metrics */}
              <div className="grid grid-cols-[140px_1fr] gap-5 items-start mt-2">
                {/* Left Circles */}
                <div className="flex flex-col gap-5 items-start py-2 px-1">
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center flex-col text-black font-extrabold shadow-md bg-white text-center border-8 border-[#ff9933]">
                    <div className="text-xl leading-none">{Math.round(novelPct)}%</div>
                    <div className="text-[11px] mt-2">Novelty</div>
                  </div>
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center flex-col text-black font-extrabold shadow-md bg-white text-center border-8 border-[#138808]">
                    <div className="text-xl leading-none">{Math.round(feasPct)}%</div>
                    <div className="text-[11px] mt-2">Feasibility</div>
                  </div>
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center flex-col text-black font-extrabold shadow-md bg-white text-center border-8 border-[#2b8fd6]">
                    <div className="text-xl leading-none">{Math.round(costPct)}%</div>
                    <div className="text-[11px] mt-2">Cost</div>
                  </div>
                  <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center flex-col text-black font-extrabold shadow-md bg-white text-center border-8 border-[#002855]">
                    <div className="text-xl leading-none">{Math.round(delivPct)}%</div>
                    <div className="text-[11px] mt-2">Deliverable</div>
                  </div>
                </div>

                {/* Metric Definitions */}
                <div className="bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                  <div className="font-extrabold text-[#002855] mb-3 text-sm">Metric Definitions</div>
                  <div className="grid grid-cols-1 gap-3 text-xs text-black leading-snug">
                    <div>
                      <div className="font-bold mb-1">Novelty</div>
                      <div className="text-black">Represents the originality and innovative contribution of the project to coal research and technology advancement.</div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">Feasibility</div>
                      <div className="text-black">Indicates how practically the project can be executed within the available time, resources, and technical capacity.</div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">Cost</div>
                      <div className="text-black">Shows the total financial requirement needed to successfully develop and implement the project.</div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">AI Score</div>
                      <div className="text-black">An automated quality score generated by AI based on clarity, relevance, innovation, and overall proposal strength.</div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">Benefit to Coal</div>
                      <div className="text-black">Represents how the project strengthens coal's role in energy security, industrial growth, economic development, and sustainable utilization.</div>
                    </div>
                    <div>
                      <div className="font-bold mb-1">Deliverable</div>
                      <div className="text-black">Defines the tangible outputs of the project such as reports, prototypes, models, datasets, or documented results.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Bar Chart */}
              <div className="flex gap-3 items-start mt-2">
                {/* Y-axis labels */}
                <div className="flex flex-col gap-2">
                  {['A+', 'A', 'B', 'C'].map((label, idx) => (
                    <div
                      key={label}
                      className={`w-11 h-9 leading-9 text-center rounded-lg font-extrabold text-sm shadow-md ${
                        (overallScore >= 85 && label === 'A+') ||
                        (overallScore >= 60 && overallScore < 85 && label === 'A') ||
                        (overallScore >= 30 && overallScore < 60 && label === 'B') ||
                        (overallScore < 30 && label === 'C')
                          ? 'bg-[#ff9933] text-white shadow-lg'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="flex-1 flex items-end gap-5 p-2 h-[200px] relative">
                  {[
                    { label: 'Novelty', value: novelPct, color: 'linear-gradient(180deg,#1e90ff,#0033aa)' },
                    { label: 'Feasibility', value: feasPct, color: 'linear-gradient(180deg,#009688,#00695c)' },
                    { label: 'Cost', value: costPct, color: 'linear-gradient(180deg,#f0b429,#c77a00)' },
                    { label: 'AI Score', value: aiScore, color: 'linear-gradient(180deg,#00c8b8,#007f5f)' },
                    { label: 'Benefit', value: benefitScore, color: 'linear-gradient(180deg,#7e57c2,#5e35b1)' },
                    { label: 'Deliverables', value: delivPct, color: 'linear-gradient(180deg,#d81b60,#8e0f3a)' }
                  ].map((bar, idx) => (
                    <div key={idx} className="w-[90px] flex flex-col items-center gap-2">
                      <div className="w-full flex items-end relative" style={{ height: '160px' }}>
                        <div
                          className="w-full rounded-t-lg relative"
                          style={{
                            height: `${(bar.value / 100) * 160}px`,
                            background: bar.color
                          }}
                        >
                          <div className="absolute left-1/2 top-2 transform -translate-x-1/2 text-white font-black text-sm drop-shadow-md">
                            {Math.round(bar.value)}%
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-xs text-[#002855] text-center">{bar.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 left-8 right-8 text-[9px] text-black flex justify-between items-end">
                <div className="max-w-[65%] leading-snug">
                  <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.
                </div>
                <div className="text-right">
                  <div className="mt-2">Page 3 of 7</div>
                </div>
              </div>
            </div>

            {/* PAGE 2 - Detailed Findings */}
            <div className="page w-[214mm] min-h-[297mm] mx-auto my-2 bg-gradient-to-b from-[#fff3e6] via-white to-[#eef8f0] p-12 relative shadow-lg border-l-4 border-l-[#ff9933] border-r-4 border-r-[#138808]">
              <div className="text-base font-bold text-[#002855] mb-3">Detailed Findings & Recommendations</div>

              <div className="grid grid-cols-2 gap-4 mt-3 text-[11px]">
                {[
                  { title: 'Novelty', data: novel, useKey: 'llm_comment' },
                  { title: 'Cost Justification', data: cost, useKey: 'comments' },
                  { title: 'Technical Feasibility', data: feas, useKey: 'comments' },
                  { title: 'Deliverables', data: deliv, useKey: 'comments' },
                  { title: 'AI Detection', data: ai, useKey: 'comments' },
                  { title: 'Benefit Check', data: benefit, useKey: 'comments' }
                ].map((card, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-300 p-3 rounded-md min-h-[150px] flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="font-bold mb-1 text-[#002855]">{card.title}</div>
                      <div className="text-[10px] text-black mb-2">
                        Score: {extractPercent(card.data) || '--'}/100
                      </div>
                      <div className="text-[11px] leading-relaxed mb-2 text-black">
                        {card.data?.[card.useKey] || card.data?.comment || 'No detailed comments available.'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 left-8 right-8 text-[9px] text-black flex justify-between items-end">
                <div className="max-w-[65%] leading-snug">
                  <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.<br />
                  Generated: {new Date().toLocaleDateString()}
                </div>
                <div className="text-right">
                  <div className="mt-2">Page 2 of 7</div>
                </div>
              </div>
            </div>


            {/* PAGE 4: SCAMPER ANALYSIS */}
            <div className="page max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] relative shadow-lg border-t-[5px] border-t-[#ff9933] border-b-[5px] border-b-[#138808] mb-5" style={{ pageBreakAfter: 'always' }}>
              
              {/* Banner */}
              <div className="border-b-[3px] border-[#002855] pb-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff9933] to-[#ff7700] flex items-center justify-center text-white font-black text-xl shadow-md">
                    MoC
                  </div>
                  <div>
                    <div className="text-xl font-black text-[#002855] uppercase tracking-tight">SCAMPER Innovation Analysis</div>
                    <div className="text-[10px] text-[#002855] mt-1">Creative Thinking Framework Assessment</div>
                  </div>
                </div>
                <div className="text-right text-[10px]">
                  <div className="text-black">Report ID: MOC-2025-{id?.slice(-4)}</div>
                  <div className="text-black mt-1">Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Introduction */}
              <div className="mb-5 bg-gradient-to-r from-[#fff3e6] to-white p-4 rounded-lg border-l-4 border-[#ff9933]">
                <div className="text-sm font-bold text-[#002855] mb-2">What is SCAMPER?</div>
                <div className="text-xs text-black leading-relaxed">
                  SCAMPER is a creative thinking technique that helps evaluate innovation by asking seven key questions: 
                  <strong> Substitute, Combine, Adapt, Modify, Put to Other Use, Eliminate, and Reverse/Rearrange</strong>. 
                  This analysis determines whether the proposal demonstrates innovative thinking in these dimensions.
                </div>
              </div>

              {/* SCAMPER Cards Grid */}
              <div className="space-y-3">
                {/* Substitute */}
                <div className={`border-2 rounded-lg p-3 ${scamperSubstitute.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperSubstitute.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      S
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Substitute</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperSubstitute.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperSubstitute.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperSubstitute.explanation || 'No explanation provided.'}
                      </div>
                      {scamperSubstitute.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperSubstitute.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Combine */}
                <div className={`border-2 rounded-lg p-3 ${scamperCombine.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperCombine.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      C
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Combine</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperCombine.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperCombine.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperCombine.explanation || 'No explanation provided.'}
                      </div>
                      {scamperCombine.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperCombine.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adapt */}
                <div className={`border-2 rounded-lg p-3 ${scamperAdapt.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperAdapt.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Adapt</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperAdapt.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperAdapt.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperAdapt.explanation || 'No explanation provided.'}
                      </div>
                      {scamperAdapt.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperAdapt.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modify */}
                <div className={`border-2 rounded-lg p-3 ${scamperModify.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperModify.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      M
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Modify / Magnify / Minify</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperModify.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperModify.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperModify.explanation || 'No explanation provided.'}
                      </div>
                      {scamperModify.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperModify.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Put to Other Use */}
                <div className={`border-2 rounded-lg p-3 ${scamperPutToUse.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperPutToUse.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      P
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Put to Other Use</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperPutToUse.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperPutToUse.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperPutToUse.explanation || 'No explanation provided.'}
                      </div>
                      {scamperPutToUse.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperPutToUse.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Eliminate */}
                <div className={`border-2 rounded-lg p-3 ${scamperEliminate.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperEliminate.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      E
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Eliminate</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperEliminate.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperEliminate.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperEliminate.explanation || 'No explanation provided.'}
                      </div>
                      {scamperEliminate.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperEliminate.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reverse / Rearrange */}
                <div className={`border-2 rounded-lg p-3 ${scamperReverse.present === 'Yes' ? 'border-[#138808] bg-[#f1f8f4]' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-black text-2xl ${scamperReverse.present === 'Yes' ? 'bg-gradient-to-br from-[#138808] to-[#0e6b06] text-white' : 'bg-gray-300 text-gray-600'}`}>
                      R
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-[#002855]">Reverse / Rearrange</div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${scamperReverse.present === 'Yes' ? 'bg-[#138808] text-white' : 'bg-gray-400 text-white'}`}>
                          {scamperReverse.present === 'Yes' ? '✓ PRESENT' : '✗ NOT PRESENT'}
                        </span>
                      </div>
                      <div className="text-xs text-black mb-2 leading-relaxed">
                        <strong>Explanation:</strong> {scamperReverse.explanation || 'No explanation provided.'}
                      </div>
                      {scamperReverse.evidence && (
                        <div className="text-xs text-black bg-white p-2 rounded border border-gray-200">
                          <strong>Evidence:</strong> <em>"{scamperReverse.evidence}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-4 left-8 right-8 text-[9px] text-black flex justify-between items-end">
                <div className="max-w-[65%] leading-snug">
                  <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.
                </div>
                <div className="text-right">
                  <div className="mt-2">Page 4 of 7</div>
                </div>
              </div>
            </div>

            {/* PAGE 5: AI DETECTION & COST VALIDATION (Part 1) */}
            <div className="page max-w-[210mm] mx-auto bg-white p-[15mm] pb-[25mm] relative shadow-lg border-t-[5px] border-t-[#ff9933] mb-5" style={{ pageBreakAfter: 'always', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
              
              <div className="flex-1">
                {/* Banner */}
                <div className="border-b-[3px] border-[#002855] pb-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff9933] to-[#ff7700] flex items-center justify-center text-white font-black text-xl shadow-md">
                      MoC
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#002855] uppercase tracking-tight">Detailed Validation Report</div>
                      <div className="text-[10px] text-[#002855] mt-1">AI Detection, Cost Compliance & Research Citations</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="text-black">Report ID: MOC-2025-{id?.slice(-4)}</div>
                    <div className="text-black mt-1">Generated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Section 1: AI Detection - Flagged Lines */}
                <div className="mb-5">
                  <div className="text-sm font-bold text-[#002855] mb-3 border-b-2 border-[#ff9933] pb-1">1. AI-Generated Content Detection</div>
                  {aiFlaggedLines && aiFlaggedLines.length > 0 ? (
                    <div className="space-y-2">
                      {aiFlaggedLines.map((line, idx) => (
                        <div key={idx} className="bg-[#fff0f5] border-l-4 border-[#d81b60] p-3 rounded">
                          <div className="flex items-start gap-2">
                            <span className="bg-[#d81b60] text-white text-[10px] font-bold px-2 py-1 rounded">FLAGGED</span>
                            <div className="flex-1 text-xs text-black leading-relaxed">
                              {line.text || line}
                            </div>
                          </div>
                          {line.confidence && (
                            <div className="mt-2 text-[10px] text-black">
                              <strong>Confidence:</strong> {Math.round(line.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#eef8f0] border border-[#138808] text-[#138808] p-3 rounded text-xs">
                      ✓ No AI-generated content detected in this proposal.
                    </div>
                  )}
                </div>

                {/* Section 2: Cost Validation - Overview */}
                <div className="mb-5">
                <div className="text-sm font-bold text-[#002855] mb-3 border-b-2 border-[#ff9933] pb-1">2. S&T Guidelines Cost Compliance</div>
                
                  <div className="text-sm font-bold text-[#002855] mb-3 border-b-2 border-[#ff9933] pb-1">2. S&T Guidelines Cost Compliance</div>
                  
                  {/* Overall Status */}
                  {costValidation.overall_comments && (
                    <div className={`p-3 rounded mb-3 border-2 ${costValidation.compliant ? 'bg-[#eef8f0] border-[#138808]' : 'bg-[#fff0f5] border-[#d81b60]'}`}>
                      <div className={`font-bold text-xs mb-2 ${costValidation.compliant ? 'text-[#138808]' : 'text-[#d81b60]'}`}>
                        Overall Status: {costValidation.compliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                      </div>
                      {costValidation.overall_comments.map((comment, idx) => (
                        <div key={idx} className="text-[11px] text-black mb-1">{comment}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with green border */}
              <div className="absolute bottom-0 left-0 right-0 border-b-[5px] border-b-[#138808]">
                <div className="px-8 pb-4 pt-2 text-[9px] text-black flex justify-between items-end bg-white">
                  <div className="max-w-[65%] leading-snug">
                    <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.
                  </div>
                  <div className="text-right">
                    <div className="mt-2">Page 5 of 7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 6: COST VALIDATION DETAILS */}
            <div className="page max-w-[210mm] mx-auto bg-white p-[15mm] pb-[25mm] relative shadow-lg border-t-[5px] border-t-[#ff9933] mb-5" style={{ pageBreakAfter: 'always', minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
              
              <div className="flex-1">
                {/* Banner */}
                <div className="border-b-[3px] border-[#002855] pb-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff9933] to-[#ff7700] flex items-center justify-center text-white font-black text-xl shadow-md">
                      MoC
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#002855] uppercase tracking-tight">Cost Validation Details</div>
                      <div className="text-[10px] text-[#002855] mt-1">Category-wise S&T Guidelines Compliance</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="text-black">Report ID: MOC-2025-{id?.slice(-4)}</div>
                    <div className="text-black mt-1">Generated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Category Validations */}
                <div className="space-y-3">
                  {Object.entries(categoryValidations).map(([category, validation]) => {
                    const isCompliant = validation.compliant === true;
                    const isNonCompliant = validation.compliant === false;
                    const requiresReview = validation.requires_manual_review === true;
                    
                    let borderColor = '#e0e0e0';
                    let bgColor = '#ffffff';
                    let badgeColor = '#6b6f71';
                    let badgeText = 'UNDER REVIEW';
                    
                    if (isCompliant) {
                      borderColor = '#138808';
                      bgColor = '#f1f8f4';
                      badgeColor = '#138808';
                      badgeText = '✓ COMPLIANT';
                    } else if (isNonCompliant) {
                      borderColor = '#d81b60';
                      bgColor = '#fff0f5';
                      badgeColor = '#d81b60';
                      badgeText = '✗ NON-COMPLIANT';
                    } else if (requiresReview) {
                      borderColor = '#ff9933';
                      bgColor = '#fff3e6';
                      badgeColor = '#ff9933';
                      badgeText = '⚠ MANUAL REVIEW';
                    }

                    return (
                      <div key={category} className="border-2 rounded p-3" style={{ borderColor, backgroundColor: bgColor }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-xs font-bold text-[#002855] uppercase">{category.replace(/_/g, ' ')}</div>
                          <span className="px-2 py-1 rounded text-[9px] font-bold text-white" style={{ backgroundColor: badgeColor }}>
                            {badgeText}
                          </span>
                        </div>
                        {validation.value !== undefined && (
                          <div className="text-[11px] text-black mb-2">
                            <strong>Amount:</strong> ₹{validation.value} Lakhs
                          </div>
                        )}
                        {validation.max_allowed !== undefined && (
                          <div className="text-[11px] text-black mb-2">
                            <strong>Max Allowed:</strong> ₹{validation.max_allowed} Lakhs
                          </div>
                        )}
                        {validation.declared_total !== undefined && (
                          <div className="text-[11px] text-black mb-2">
                            <strong>Declared Total:</strong> ₹{validation.declared_total}L | <strong>Computed Sum:</strong> ₹{validation.computed_sum}L
                          </div>
                        )}
                        {validation.comments && (
                          <div className="space-y-1">
                            {validation.comments.map((comment, idx) => (
                              <div key={idx} className="text-[10px] text-black leading-relaxed">{comment}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer with green border */}
              <div className="absolute bottom-0 left-0 right-0 border-b-[5px] border-b-[#138808]">
                <div className="px-8 pb-4 pt-2 text-[9px] text-black flex justify-between items-end bg-white">
                  <div className="max-w-[65%] leading-snug">
                    <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.
                  </div>
                  <div className="text-right">
                    <div className="mt-2">Page 6 of 7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 7: RESEARCH CITATIONS */}
            <div className="page max-w-[210mm] mx-auto bg-white p-[15mm] pb-[25mm] relative shadow-lg border-t-[5px] border-t-[#ff9933] mb-5" style={{ minHeight: '297mm', display: 'flex', flexDirection: 'column' }}>
              
              <div className="flex-1">
                {/* Banner */}
                <div className="border-b-[3px] border-[#002855] pb-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff9933] to-[#ff7700] flex items-center justify-center text-white font-black text-xl shadow-md">
                      MoC
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#002855] uppercase tracking-tight">Research Citations & Prior Art</div>
                      <div className="text-[10px] text-[#002855] mt-1">Global and Internal Research References</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="text-black">Report ID: MOC-2025-{id?.slice(-4)}</div>
                    <div className="text-black mt-1">Generated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Section: Novelty Citations */}
                <div className="mb-5">
                
                {/* Global Citations */}
                {novelCitationsGlobal && novelCitationsGlobal.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-[#002855] mb-2">Global Research Citations ({novelCitationsGlobal.length})</div>
                    <div className="space-y-2">
                      {novelCitationsGlobal.map((citation, idx) => (
                        <div key={idx} className="bg-white border border-[#002855] rounded p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-[11px] font-bold text-[#002855] flex-1">{citation.title}</div>
                            {citation.year && (
                              <span className="text-[10px] bg-[#002855] text-white px-2 py-0.5 rounded font-bold">{citation.year}</span>
                            )}
                          </div>
                          {citation.similarity !== undefined && (
                            <div className="text-[10px] text-black mb-1">
                              <strong>Similarity Score:</strong> {Math.round(citation.similarity * 100)}%
                            </div>
                          )}
                          {citation.url && (
                            <a 
                              href={citation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#0057b7] hover:text-[#003d82] underline break-all"
                            >
                              {citation.url}
                            </a>
                          )}
                          {citation.snippet && (
                            <div className="text-[10px] text-black mt-2 italic">"{citation.snippet}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Citations */}
                {novelCitationsInternal && novelCitationsInternal.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-[#002855] mb-2">Internal Citations ({novelCitationsInternal.length})</div>
                    <div className="space-y-2">
                      {novelCitationsInternal.map((citation, idx) => (
                        <div key={idx} className="bg-[#fff3e6] border border-[#ff9933] rounded p-3">
                          <div className="text-[11px] font-bold text-[#002855] mb-1">{citation.title}</div>
                          {citation.similarity !== undefined && (
                            <div className="text-[10px] text-black">
                              <strong>Similarity:</strong> {Math.round(citation.similarity * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                  {(!novelCitationsGlobal || novelCitationsGlobal.length === 0) && (!novelCitationsInternal || novelCitationsInternal.length === 0) && (
                    <div className="bg-gray-50 border border-gray-300 text-gray-600 p-3 rounded text-xs">
                      No research citations found for this proposal.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with green border */}
              <div className="absolute bottom-0 left-0 right-0 border-b-[5px] border-b-[#138808]">
                <div className="px-8 pb-4 pt-2 text-[9px] text-black flex justify-between items-end bg-white">
                  <div className="max-w-[65%] leading-snug">
                    <strong>Ministry of Coal, Government of India</strong> · Confidential · For internal evaluation purposes only.
                  </div>
                  <div className="text-right">
                    <div className="mt-2">Page 7 of 7</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
