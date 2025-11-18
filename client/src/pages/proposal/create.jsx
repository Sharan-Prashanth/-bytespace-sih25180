import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ROLES } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Navbar from "../../components/Navbar";
import AdvancedProposalEditor from "../../components/AdvancedProposalEditor";
import Chatbot from "../../components/Chatbot";



function CreateProposalContent() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const uploadSectionRef = useRef(null);


  
  // UI State Management
  const [editorMode, setEditorMode] = useState('editor'); // 'editor' or 'upload'
  const [showSaarthi, setShowSaarthi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStage, setSubmissionStage] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  

  
  // Editor State
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [proposalData, setProposalData] = useState({
    projectTitle: '',
    fundingMethod: 'S&T of MoC',
    implementingAgency: '', // Principal Implementing Agency
    subImplementingAgency: '',
    projectLeader: '',
    projectCoordinator: '',
    coInvestigators: '',
    domain: 'Coal Technology & Clean Energy',
    projectOutlayLakhs: '',
    durationMonths: ''
  });

  // Editor content and counts state
  const [editorContent, setEditorContent] = useState('');

  // File Upload Simulation
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    const stages = [
      { stage: 'Scanning for viruses and malware...', duration: 2000 },
      { stage: 'Validating document format...', duration: 1500 },
      { stage: 'Parsing document structure...', duration: 2500 },
      { stage: 'Extracting content to editor...', duration: 3000 },
      { stage: 'Processing images and tables...', duration: 2000 },
      { stage: 'Applying NaCCER compliance check...', duration: 1800 },
      { stage: 'Storing securely on blockchain...', duration: 2200 },
      { stage: 'Finalizing secure import...', duration: 1500 }
    ];

    let currentProgress = 0;
    const progressPerStage = 100 / stages.length;
    
    for (let i = 0; i < stages.length; i++) {
      setUploadStage(stages[i].stage);
      
      await new Promise(resolve => {
        const interval = setInterval(() => {
          currentProgress += Math.random() * 4 + 1;
          const targetProgress = (i + 1) * progressPerStage;
          if (currentProgress >= targetProgress) {
            currentProgress = targetProgress;
            setUploadProgress(currentProgress);
            clearInterval(interval);
            resolve();
          } else {
            setUploadProgress(currentProgress);
          }
        }, 150);
      });
      
      await new Promise(resolve => setTimeout(resolve, stages[i].duration));
    }

    setUploadProgress(100);
    setUploadStage('Document uploaded and blockchain verified successfully!');
    
    setTimeout(() => {
      setUploadSuccess(true);
      setIsUploading(false);
    }, 1000);
  };

  // Per-field upload state (Covering Letter, Proposal, CV)
  const [selectedFiles, setSelectedFiles] = useState({
    coveringLetter: null,
    proposal: null,
    cv: null,
  });

  const [fieldIsUploading, setFieldIsUploading] = useState({
    coveringLetter: false,
    proposal: false,
    cv: false,
  });

  const [fieldUploadProgress, setFieldUploadProgress] = useState({
    coveringLetter: 0,
    proposal: 0,
    cv: 0,
  });

  const [fieldUploadStage, setFieldUploadStage] = useState({
    coveringLetter: '',
    proposal: '',
    cv: '',
  });

  const [fieldUploadSuccess, setFieldUploadSuccess] = useState({
    coveringLetter: false,
    proposal: false,
    cv: false,
  });

  const [fieldError, setFieldError] = useState({
    coveringLetter: '',
    proposal: '',
    cv: '',
  });

  const FILE_LIMITS = {
    coveringLetter: 2 * 1024 * 1024, // 2 MB
    proposal: 20 * 1024 * 1024, // 20 MB
    cv: 10 * 1024 * 1024, // 10 MB
  };

  const validateFile = (field, file) => {
    if (!file) return 'No file selected';
    const name = file.name || '';
    const lower = name.toLowerCase();
    if (!lower.endsWith('.pdf')) return 'Only PDF files are allowed';
    const limit = FILE_LIMITS[field] || 5 * 1024 * 1024;
    if (file.size > limit) return `File exceeds maximum size of ${Math.round(limit / 1024 / 1024)} MB`;
    return '';
  };

  const handleSelectFile = (field, e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSelectedFiles(prev => ({ ...prev, [field]: file }));
    setFieldError(prev => ({ ...prev, [field]: '' }));
    setFieldUploadProgress(prev => ({ ...prev, [field]: 0 }));
    setFieldUploadStage(prev => ({ ...prev, [field]: '' }));
    setFieldUploadSuccess(prev => ({ ...prev, [field]: false }));
  };

  const uploadFieldFile = async (field) => {
    const file = selectedFiles[field];
    const err = validateFile(field, file);
    if (err) { setFieldError(prev => ({ ...prev, [field]: err })); return; }

    setFieldIsUploading(prev => ({ ...prev, [field]: true }));
    setFieldUploadProgress(prev => ({ ...prev, [field]: 0 }));
    setFieldUploadSuccess(prev => ({ ...prev, [field]: false }));

    const stages = [
      { stage: 'Validating file...', duration: 800 },
      { stage: 'Scanning for viruses...', duration: 1000 },
      { stage: 'Optimizing for storage...', duration: 900 },
      { stage: 'Storing securely...', duration: 1200 },
      { stage: 'Finalizing upload...', duration: 700 }
    ];

    let currentProgress = 0;
    const progressPerStage = 100 / stages.length;

    for (let i = 0; i < stages.length; i++) {
      setFieldUploadStage(prev => ({ ...prev, [field]: stages[i].stage }));
      await new Promise(resolve => {
        const interval = setInterval(() => {
          currentProgress += Math.random() * 6 + 2;
          const target = (i + 1) * progressPerStage;
          if (currentProgress >= target) {
            currentProgress = target;
            setFieldUploadProgress(prev => ({ ...prev, [field]: Math.round(currentProgress) }));
            clearInterval(interval);
            resolve();
          } else {
            setFieldUploadProgress(prev => ({ ...prev, [field]: Math.round(currentProgress) }));
          }
        }, 120);
      });
      await new Promise(res => setTimeout(res, stages[i].duration));
    }

    setFieldUploadProgress(prev => ({ ...prev, [field]: 100 }));
    setFieldUploadStage(prev => ({ ...prev, [field]: 'Upload complete' }));

    // Simulate server storage delay
    setTimeout(() => {
      setFieldIsUploading(prev => ({ ...prev, [field]: false }));
      setFieldUploadSuccess(prev => ({ ...prev, [field]: true }));
    }, 600);
  };





  // File Download Handlers
  const handleDownload = (filename) => {
    // Simulate file download
    const link = document.createElement('a');
    link.href = `/files/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Input Handlers
  const handleInputChange = (field, value) => {
    setProposalData(prev => ({ ...prev, [field]: value }));
  };

  // Handler functions for editor
  const handleEditorContentChange = (content) => {
    setEditorContent(content);
  };

  const handleWordCountChange = (count) => {
    setWordCount(count);
  };

  const handleCharacterCountChange = (count) => {
    setCharacterCount(count);
  };

  // Submission Handler with AI Analysis
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmissionProgress(0);
    setShowEvaluation(false);
    
    const stages = [
      { stage: 'Checking novelty against existing research...', duration: 2000 },
      { stage: 'Analyzing technical feasibility...', duration: 2500 },
      { stage: 'Validating budget and timeline...', duration: 1800 },
      { stage: 'Comparing with similar proposals...', duration: 2200 },
      { stage: 'Securing blockchain storage...', duration: 1500 }
    ];

    let currentProgress = 0;
    
    for (let i = 0; i < stages.length; i++) {
      setSubmissionStage(stages[i].stage);
      
      await new Promise(resolve => {
        const interval = setInterval(() => {
          currentProgress += Math.random() * 12;
          if (currentProgress >= (i + 1) * 20) {
            currentProgress = (i + 1) * 20;
            setSubmissionProgress(currentProgress);
            clearInterval(interval);
            resolve();
          } else {
            setSubmissionProgress(currentProgress);
          }
        }, 150);
      });
      
      await new Promise(resolve => setTimeout(resolve, stages[i].duration));
    }

    setSubmissionProgress(100);
    setSubmissionStage('Analysis completed successfully!');
    
    setTimeout(() => {
      setShowEvaluation(true);
    }, 1000);

    // Simulate backend submission
    setTimeout(() => {
      setIsSubmitting(false);
    }, 3000);
  };

  // Mock Evaluation Scores
  const evaluationScores = {
    technicalExcellence: Math.floor(Math.random() * 15) + 85, // 85-100
    financialViability: Math.floor(Math.random() * 20) + 75, // 75-95
    strategicAlignment: Math.floor(Math.random() * 10) + 90, // 90-100
    teamCompetency: Math.floor(Math.random() * 18) + 80, // 80-98
    impactPotential: Math.floor(Math.random() * 12) + 88  // 88-100
  };

  const overallScore = Math.round(
    (evaluationScores.technicalExcellence + 
     evaluationScores.financialViability + 
     evaluationScores.strategicAlignment + 
     evaluationScores.teamCompetency + 
     evaluationScores.impactPotential) / 5
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Distinctive Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-[280px]">
        {/* Animated geometric patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-6 left-10 w-12 h-12 border border-blue-400/30 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-10 h-10 border border-indigo-400/20 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-12 left-32 w-8 h-8 bg-blue-500/10 rounded-full animate-bounce"></div>
          <div className="absolute top-12 right-40 w-4 h-4 bg-indigo-400/20 rounded-full animate-ping"></div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        
        {/* Header Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="group">
            <div className="flex items-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              <div className="ml-6">
                <div className="flex items-center mb-2">
                  <h1 className="text-white text-4xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Create R&D Proposal
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                    <span className="text-blue-100 font-semibold text-lg">NaCCER Research Portal</span>
                  </div>
                  <div className="h-4 w-px bg-blue-300/50"></div>
                  <span className="text-blue-200 font-medium text-sm">Department of Coal</span>
                </div>
              </div>
            </div>
            
            {/* PRISM Banner */}
            <div className="bg-orange-600 backdrop-blur-md rounded-2xl p-4 border border-orange-300/40 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-white to-orange-50 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border border-orange-200/50">
                    <img 
                      src="/images/prism brand logo.png" 
                      alt="PRISM Logo" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl mb-1 flex items-center">
                    <span className="text-white drop-shadow-md tracking-wide">PRISM</span>
                    <div className="ml-3 px-2 py-0.5 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full flex items-center justify-center border border-green-300/40 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 bg-green-300 rounded-full mr-1.5 animate-pulse"></div>
                      <span className="text-white text-xs font-semibold drop-shadow-sm">ACTIVE</span>
                    </div>
                  </h2>
                  <p className="text-orange-50 text-sm leading-relaxed font-medium opacity-95 drop-shadow-sm">
                    Proposal Review & Innovation Support Mechanism for Department of Coal's Advanced Research Platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* SAARTHI AI Assistant - Modularized Component */}
        <Chatbot showSaarthi={showSaarthi} setShowSaarthi={setShowSaarthi} />

        {/* Guidelines and Templates Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
          <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            Guidelines & Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="group relative overflow-hidden border border-orange-200 rounded-lg p-4 bg-orange-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-black">S&T Guidelines</h3>
                </div>
                <p className="text-black text-sm mb-3 leading-relaxed">
                  Comprehensive R&D guidelines for Department of Coal including requirements, 
                  evaluation criteria, and submission protocols.
                </p>
                <button
                  onClick={() => handleDownload('S&T-Guidelines-MoC.pdf')}
                  className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Guidelines (PDF)
                </button>
              </div>
            </div>
            
            <div className="group relative overflow-hidden border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a4 4 0 01-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-black">Proposal Template</h3>
                </div>
                <p className="text-black text-sm mb-3 leading-relaxed">
                  Standardized template ensuring all required sections for coal research 
                  proposals are properly structured and formatted.
                </p>
                <button
                  onClick={() => handleDownload('proposal-template.docx')}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template (DOCX)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Documents Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
          <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            Upload Documents
          </h2>
          
          {/* Important Note */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-black font-medium">
                <strong>Important Note:</strong> Please upload one document at a time.
              </p>
            </div>
          </div>

          {/* Document Upload Fields */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* 1. Covering Letter Upload */}
            <div className="bg-white rounded-lg border-2 border-orange-200 p-5 hover:border-orange-300 transition-all duration-300 hover:shadow-md">
              <h4 className="text-base font-bold text-black mb-3 flex items-center">
                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 mr-2">1</span>
                Covering Letter Upload
              </h4>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Select covering letter to Upload (Covering Letter in PDF format with size less than 2 MB)
              </p>
              
              <div className="mb-3">
                <input
                  id="coveringLetterUpload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleSelectFile('coveringLetter', e)}
                  className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer cursor-pointer"
                />
              </div>
              
              {selectedFiles.coveringLetter && (
                <div className="text-xs text-black mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <strong>Selected:</strong> {selectedFiles.coveringLetter.name}
                </div>
              )}
              
              {fieldError.coveringLetter && (
                <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                  {fieldError.coveringLetter}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => uploadFieldFile('coveringLetter')}
                disabled={fieldIsUploading.coveringLetter || !selectedFiles.coveringLetter}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {fieldIsUploading.coveringLetter ? 'Uploading...' : 'Upload'}
              </button>
              
              <div className="text-xs text-gray-500 mb-2">
                <strong>Allowed format:</strong> PDF
              </div>
              <div className="text-xs text-gray-500">
                <strong>Maximum size:</strong> 2 MB
              </div>
              
              {fieldIsUploading.coveringLetter && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      style={{ width: `${fieldUploadProgress.coveringLetter}%` }} 
                      className="h-2 bg-orange-500 transition-all duration-300 rounded-full"
                    ></div>
                  </div>
                  <div className="text-xs text-black">
                    {fieldUploadStage.coveringLetter} • {fieldUploadProgress.coveringLetter}%
                  </div>
                </div>
              )}
              
              {fieldUploadSuccess.coveringLetter && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center text-xs text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Uploaded successfully
                  </div>
                </div>
              )}
            </div>

            {/* 2. Proposal Document Upload */}
            <div className="bg-white rounded-lg border-2 border-orange-200 p-5 hover:border-orange-300 transition-all duration-300 hover:shadow-md">
              <h4 className="text-base font-bold text-black mb-3 flex items-center">
                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 mr-2">2</span>
                Proposal Document Upload
              </h4>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Select proposal to Upload (Proposal in PDF format with size less than 20 MB)
              </p>
              
              <div className="mb-3">
                <input
                  id="proposalDocUpload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleSelectFile('proposal', e)}
                  className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer cursor-pointer"
                />
              </div>
              
              {selectedFiles.proposal && (
                <div className="text-xs text-black mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <strong>Selected:</strong> {selectedFiles.proposal.name}
                </div>
              )}
              
              {fieldError.proposal && (
                <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                  {fieldError.proposal}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => uploadFieldFile('proposal')}
                disabled={fieldIsUploading.proposal || !selectedFiles.proposal}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {fieldIsUploading.proposal ? 'Uploading...' : 'Upload'}
              </button>
              
              <div className="text-xs text-gray-500 mb-2">
                <strong>Allowed format:</strong> PDF
              </div>
              <div className="text-xs text-gray-500">
                <strong>Maximum size:</strong> 20 MB
              </div>
              
              {fieldIsUploading.proposal && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      style={{ width: `${fieldUploadProgress.proposal}%` }} 
                      className="h-2 bg-orange-500 transition-all duration-300 rounded-full"
                    ></div>
                  </div>
                  <div className="text-xs text-black">
                    {fieldUploadStage.proposal} • {fieldUploadProgress.proposal}%
                  </div>
                </div>
              )}
              
              {fieldUploadSuccess.proposal && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center text-xs text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Uploaded successfully
                  </div>
                </div>
              )}
            </div>

            {/* 3. CV Upload */}
            <div className="bg-white rounded-lg border-2 border-orange-200 p-5 hover:border-orange-300 transition-all duration-300 hover:shadow-md">
              <h4 className="text-base font-bold text-black mb-3 flex items-center">
                <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 mr-2">3</span>
                CV Upload
              </h4>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Select CV to Upload (CV in PDF format with size less than 10 MB)
              </p>
              
              <div className="mb-3">
                <input
                  id="cvUpload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleSelectFile('cv', e)}
                  className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer cursor-pointer"
                />
              </div>
              
              {selectedFiles.cv && (
                <div className="text-xs text-black mb-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <strong>Selected:</strong> {selectedFiles.cv.name}
                </div>
              )}
              
              {fieldError.cv && (
                <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                  {fieldError.cv}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => uploadFieldFile('cv')}
                disabled={fieldIsUploading.cv || !selectedFiles.cv}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {fieldIsUploading.cv ? 'Uploading...' : 'Upload'}
              </button>
              
              <div className="text-xs text-gray-500 mb-2">
                <strong>Allowed format:</strong> PDF
              </div>
              <div className="text-xs text-gray-500">
                <strong>Maximum size:</strong> 10 MB
              </div>
              
              {fieldIsUploading.cv && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1">
                    <div 
                      style={{ width: `${fieldUploadProgress.cv}%` }} 
                      className="h-2 bg-orange-500 transition-all duration-300 rounded-full"
                    ></div>
                  </div>
                  <div className="text-xs text-black">
                    {fieldUploadStage.cv} • {fieldUploadProgress.cv}%
                  </div>
                </div>
              )}
              
              {fieldUploadSuccess.cv && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center text-xs text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Uploaded successfully
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Mode Toggle */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Choose Your Proposal Creation Method
            </h2>
            <p className="text-black mb-6 text-sm">Select how you want to create your research proposal. You can either upload an existing document or start fresh with our online editor.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                onClick={() => {
                  setEditorMode('upload');
                  setTimeout(() => {
                    uploadSectionRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }, 100);
                }}
                className={`group relative overflow-hidden border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                  editorMode === 'upload'
                    ? 'border-orange-500 bg-orange-100 hover:shadow-xl shadow-lg shadow-orange-200/50 ring-2 ring-orange-300/50 transform scale-[1.02]'
                    : 'border-orange-200 bg-orange-50 hover:shadow-lg hover:border-orange-300'
                }`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-all duration-300 ${
                      editorMode === 'upload' 
                        ? 'bg-orange-500 shadow-lg' 
                        : 'bg-orange-100'
                    }`}>
                      <svg className={`w-5 h-5 transition-all duration-300 ${
                        editorMode === 'upload' ? 'text-white' : 'text-orange-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black">Upload Existing Document</h3>
                      {editorMode === 'upload' && (
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-orange-600 font-medium">SELECTED</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-black text-sm mb-3 leading-relaxed">
                    Upload your existing Word document (.doc/.docx) and continue editing with our advanced online editor.
                  </p>
                  <div className="text-xs text-black">
                    ✓ Preserve existing formatting<br/>
                    ✓ AI assistance available<br/>
                    ✓ Export to PDF/DOC
                  </div>
                </div>
              </div>
              
              <div 
                onClick={() => setEditorMode('editor')}
                className={`group relative overflow-hidden border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                  editorMode === 'editor'
                    ? 'border-green-500 bg-green-100 hover:shadow-xl shadow-lg shadow-green-200/50 ring-2 ring-green-300/50 transform scale-[1.02]'
                    : 'border-green-200 bg-green-50 hover:shadow-lg hover:border-green-300'
                }`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-600/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-all duration-300 ${
                      editorMode === 'editor' 
                        ? 'bg-green-500 shadow-lg' 
                        : 'bg-green-100'
                    }`}>
                      <svg className={`w-5 h-5 transition-all duration-300 ${
                        editorMode === 'editor' ? 'text-white' : 'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black">Create with Online Editor</h3>
                      {editorMode === 'editor' && (
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs text-green-600 font-medium">SELECTED</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-black text-sm mb-3 leading-relaxed">
                    Start fresh with our comprehensive online editor featuring rich formatting tools and templates.
                  </p>
                  <div className="text-xs text-black">
                    ✓ Rich text formatting<br/>
                    ✓ Built-in templates<br/>
                    ✓ Real-time collaboration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${showSaarthi ? 'flex gap-8' : 'block'} transition-all duration-500`}>
          {/* Main Content Section */}
          <div className={showSaarthi ? 'flex-1' : 'w-full'}>
            {/* File Upload Section */}
            {editorMode === 'upload' && (
              <div ref={uploadSectionRef} className="bg-white rounded-xl border border-gray-200 shadow-lg mb-8">
                <div className="border-b border-orange-200 px-6 py-4 bg-orange-50 rounded-t-xl">
                  <h2 className="text-xl font-bold text-black flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    Document Upload & Edit
                  </h2>
                  <p className="text-sm text-black mt-1">Upload your existing document and continue editing in our online editor</p>
                </div>
                <div className="p-6">
                  {!isUploading && !uploadSuccess ? (
                    <>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Covering Letter */}
                        <div className="bg-white rounded-lg border border-orange-200 p-4">
                          <h4 className="text-sm font-semibold text-black mb-2">1. Covering Letter Upload</h4>
                          <p className="text-xs text-gray-600 mb-2">Select covering letter to Upload (Covering Letter in PDF format with size less than 2 MB)</p>
                          <input
                            id="coveringLetter"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => handleSelectFile('coveringLetter', e)}
                            className="mb-2"
                          />
                          {selectedFiles.coveringLetter && (
                            <div className="text-xs text-black mb-2">Selected: {selectedFiles.coveringLetter.name}</div>
                          )}
                          {fieldError.coveringLetter && <div className="text-xs text-red-600 mb-2">{fieldError.coveringLetter}</div>}
                          <button
                            type="button"
                            onClick={() => uploadFieldFile('coveringLetter')}
                            disabled={fieldIsUploading.coveringLetter}
                            className="w-full bg-orange-600 text-white py-2 rounded-md text-sm mb-2 disabled:opacity-50"
                          >
                            Upload
                          </button>
                          <div className="text-xs text-gray-500">Allowed format: PDF • Max size: 2 MB</div>
                          {fieldIsUploading.coveringLetter && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${fieldUploadProgress.coveringLetter}%` }} className="h-2 bg-orange-500"></div>
                              </div>
                              <div className="text-xs mt-1">{fieldUploadStage.coveringLetter} • {fieldUploadProgress.coveringLetter}%</div>
                            </div>
                          )}
                          {fieldUploadSuccess.coveringLetter && <div className="text-xs text-green-600 mt-2">Uploaded successfully</div>}
                        </div>

                        {/* Proposal Document */}
                        <div className="bg-white rounded-lg border border-orange-200 p-4">
                          <h4 className="text-sm font-semibold text-black mb-2">2. Proposal Document Upload</h4>
                          <p className="text-xs text-gray-600 mb-2">Select proposal to Upload (Proposal in PDF format with size less than 20 MB)</p>
                          <input
                            id="proposalDoc"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => handleSelectFile('proposal', e)}
                            className="mb-2"
                          />
                          {selectedFiles.proposal && (
                            <div className="text-xs text-black mb-2">Selected: {selectedFiles.proposal.name}</div>
                          )}
                          {fieldError.proposal && <div className="text-xs text-red-600 mb-2">{fieldError.proposal}</div>}
                          <button
                            type="button"
                            onClick={() => uploadFieldFile('proposal')}
                            disabled={fieldIsUploading.proposal}
                            className="w-full bg-orange-600 text-white py-2 rounded-md text-sm mb-2 disabled:opacity-50"
                          >
                            Upload
                          </button>
                          <div className="text-xs text-gray-500">Allowed format: PDF • Max size: 20 MB</div>
                          {fieldIsUploading.proposal && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${fieldUploadProgress.proposal}%` }} className="h-2 bg-orange-500"></div>
                              </div>
                              <div className="text-xs mt-1">{fieldUploadStage.proposal} • {fieldUploadProgress.proposal}%</div>
                            </div>
                          )}
                          {fieldUploadSuccess.proposal && <div className="text-xs text-green-600 mt-2">Uploaded successfully</div>}
                        </div>

                        {/* CV Upload */}
                        <div className="bg-white rounded-lg border border-orange-200 p-4">
                          <h4 className="text-sm font-semibold text-black mb-2">3. CV Upload</h4>
                          <p className="text-xs text-gray-600 mb-2">Select CV to Upload (CV in PDF format with size less than 10 MB)</p>
                          <input
                            id="cvUpload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => handleSelectFile('cv', e)}
                            className="mb-2"
                          />
                          {selectedFiles.cv && (
                            <div className="text-xs text-black mb-2">Selected: {selectedFiles.cv.name}</div>
                          )}
                          {fieldError.cv && <div className="text-xs text-red-600 mb-2">{fieldError.cv}</div>}
                          <button
                            type="button"
                            onClick={() => uploadFieldFile('cv')}
                            disabled={fieldIsUploading.cv}
                            className="w-full bg-orange-600 text-white py-2 rounded-md text-sm mb-2 disabled:opacity-50"
                          >
                            Upload
                          </button>
                          <div className="text-xs text-gray-500">Allowed format: PDF • Max size: 10 MB</div>
                          {fieldIsUploading.cv && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${fieldUploadProgress.cv}%` }} className="h-2 bg-orange-500"></div>
                              </div>
                              <div className="text-xs mt-1">{fieldUploadStage.cv} • {fieldUploadProgress.cv}%</div>
                            </div>
                          )}
                          {fieldUploadSuccess.cv && <div className="text-xs text-green-600 mt-2">Uploaded successfully</div>}
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-black mb-2">Important Note</h4>
                        <p className="text-sm text-black">Please upload one document at a time. Use the Upload button next to each field to start its upload. Files must be PDF and respect the maximum sizes shown.</p>
                      </div>
                    </>
                  ) : isUploading ? (
                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                      {/* Enhanced Loading Animation with Indian Flag Colors */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          {/* Orange-White-Green Ring with Visible White */}
                          <div className="w-20 h-20 rounded-full animate-spin" style={{
                            animationDuration: '2s',
                            background: 'conic-gradient(from 0deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '4px'
                          }}>
                            <div className="w-full h-full bg-orange-50 rounded-full"></div>
                          </div>
                          {/* Inner Ring with Visible White */}
                          <div className="absolute inset-2 w-16 h-16 rounded-full animate-spin" style={{
                            animationDuration: '1.5s', 
                            animationDirection: 'reverse',
                            background: 'conic-gradient(from 180deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '3px'
                          }}>
                            <div className="w-full h-full bg-orange-50 rounded-full"></div>
                          </div>
                          {/* Prism Logo in Center */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-orange-200 flex items-center justify-center">
                              <img 
                                src="/images/prism brand logo.png" 
                                alt="Prism Logo" 
                                className="w-6 h-6 object-contain animate-pulse"
                              />
                            </div>
                          </div>
                          {/* Simplified Particles */}
                          <div className="absolute -top-2 -left-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                          <div className="absolute -top-2 -right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                          <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                        </div>
                      </div>
                      
                      {/* Stage Display with Enhanced Typography */}
                      <div className="text-center mb-4">
                        <div className="text-lg font-semibold text-black mb-1 animate-pulse">
                          {uploadStage}
                        </div>
                        <div className="text-sm text-black">
                          Secure Blockchain Processing • NaCCER Compliant
                        </div>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-black">Processing Progress</span>
                          <span className="text-sm font-bold text-orange-600">
                            {Math.round(uploadProgress)}%
                          </span>
                        </div>
                        
                        {/* Clean Progress Bar */}
                        <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                          {/* Simple Clean Progress Fill */}
                          <div 
                            className="h-full transition-all duration-1000 ease-out rounded-full"
                            style={{ 
                              width: `${uploadProgress}%`,
                              background: uploadProgress <= 50 ? 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)' :
                                         'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #22c55e 100%)'
                            }}
                          ></div>
                        </div>
                        
                        {/* Simple Orange-Green Progress Milestones */}
                        <div className="flex justify-between text-xs text-gray-500 mt-3">
                          <span className={uploadProgress >= 12.5 ? 'text-orange-600 font-semibold' : ''}>Security</span>
                          <span className={uploadProgress >= 25 ? 'text-orange-500 font-semibold' : ''}>Validation</span>
                          <span className={uploadProgress >= 37.5 ? 'text-orange-600 font-semibold' : ''}>Parsing</span>
                          <span className={uploadProgress >= 50 ? 'text-orange-500 font-semibold' : ''}>Verification</span>
                          <span className={uploadProgress >= 62.5 ? 'text-green-500 font-semibold' : ''}>Processing</span>
                          <span className={uploadProgress >= 75 ? 'text-green-600 font-semibold' : ''}>Compliance</span>
                          <span className={uploadProgress >= 87.5 ? 'text-green-700 font-semibold' : ''}>Blockchain</span>
                          <span className={uploadProgress >= 100 ? 'text-green-800 font-semibold' : ''}>Complete</span>
                        </div>
                      </div>
                      
                      {/* Security Badge */}
                      <div className="flex items-center justify-center space-x-3 text-xs text-black bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span>Blockchain secured</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span>End-to-end encrypted</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Government compliant</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Virus protected</span>
                        </div>
                      </div>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="bg-white rounded-lg p-8 border-2 border-green-200 text-center shadow-lg">
                      {/* Indian Flag Success Animation */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          {/* Success Ring with Visible White */}
                          <div className="w-28 h-28 rounded-full animate-spin" style={{
                            animationDuration: '3s',
                            background: 'conic-gradient(from 0deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '4px'
                          }}>
                            <div className="w-full h-full bg-white rounded-full"></div>
                          </div>
                          {/* Inner Success Ring with Visible White */}
                          <div className="absolute inset-3 w-22 h-22 rounded-full animate-spin" style={{
                            animationDuration: '2s', 
                            animationDirection: 'reverse',
                            background: 'conic-gradient(from 180deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '3px'
                          }}>
                            <div className="w-full h-full bg-white rounded-full"></div>
                          </div>
                          {/* Simple Orange-Green Checkmark Background */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-18 h-18 rounded-full flex items-center justify-center animate-pulse shadow-lg border-2 border-white" style={{background: 'linear-gradient(135deg, #f97316 0%, #22c55e 100%)'}}>
                              <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          {/* Simplified Celebration Particles */}
                          <div className="absolute -top-2 -left-2 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                          <div className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                          <div className="absolute -bottom-2 -right-2 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                          <div className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                        </div>
                      </div>
                      
                      {/* Success Message */}
                      <h3 className="text-2xl font-bold text-black mb-2">Upload Successful!</h3>
                      <p className="text-black mb-6">Your document has been securely processed and stored on blockchain.</p>
                      
                      {/* Professional Success Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-sm font-bold text-orange-600">SECURE</div>
                          <div className="text-xs text-gray-500">Virus Free</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1m-5 5l4 4" />
                            </svg>
                          </div>
                          <div className="text-sm font-bold text-blue-600">BLOCKCHAIN</div>
                          <div className="text-xs text-gray-500">Immutable Storage</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </div>
                          <div className="text-sm font-bold text-green-600">READY</div>
                          <div className="text-xs text-gray-500">Editor Ready</div>
                        </div>
                      </div>
                      
                      {/* Call to Action */}
                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            setUploadSuccess(false);
                            setEditorMode('editor');
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-orange-500 flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span>Continue to Smart Editor</span>
                        </button>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm text-black text-center">
                            Your document is now securely stored on blockchain and loaded in our AI-powered editor. 
                            You can make additional changes, get SAARTHI assistance, or proceed with your NaCCER submission.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Proposal Form Section */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Proposal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Title of Research Proposal *</label>
                    <input
                      type="text"
                      value={proposalData.projectTitle}
                      onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                      maxLength={150}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Enter your innovative project title (max 150 characters)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Required Research Funding Method *</label>
                    <select
                      value={proposalData.fundingMethod}
                      onChange={(e) => handleInputChange('fundingMethod', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                    >
                      <option value="S&T of MoC">S&T of MoC</option>
                      <option value="R&D of CIL">R&D of CIL</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Name of the Principal Implementing Agency *</label>
                    <input
                      type="text"
                      value={proposalData.implementingAgency}
                      onChange={(e) => handleInputChange('implementingAgency', e.target.value)}
                      maxLength={100}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Name of principal implementing organization (max 100 chars)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Name of the Sub-Implementing Agency *</label>
                    <input
                      type="text"
                      value={proposalData.subImplementingAgency}
                      onChange={(e) => handleInputChange('subImplementingAgency', e.target.value)}
                      maxLength={100}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Name of sub-implementing agency (max 100 chars)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Name of the Project Leader *</label>
                    <input
                      type="text"
                      value={proposalData.projectLeader}
                      onChange={(e) => handleInputChange('projectLeader', e.target.value)}
                      maxLength={100}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Principal investigator name (max 100 chars)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Name of the Project Coordinator *</label>
                    <input
                      type="text"
                      value={proposalData.projectCoordinator}
                      onChange={(e) => handleInputChange('projectCoordinator', e.target.value)}
                      maxLength={100}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Project coordinator name (max 100 chars)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Co-investigators</label>
                    <input
                      type="text"
                      value={proposalData.coInvestigators}
                      onChange={(e) => handleInputChange('coInvestigators', e.target.value)}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Names of co-investigators"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Project Outlay (Rs. in Lakhs) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposalData.projectOutlayLakhs}
                      onChange={(e) => handleInputChange('projectOutlayLakhs', e.target.value)}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Project outlay in lakhs (e.g., 150.50)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Project Duration (in months) *</label>
                    <input
                      type="number"
                      min="1"
                      value={proposalData.durationMonths}
                      onChange={(e) => handleInputChange('durationMonths', e.target.value)}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                      placeholder="Duration in months (e.g., 24)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black mb-1">Research Domain</label>
                    <select
                      value={proposalData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-orange-50 hover:bg-white text-black text-xs"
                    >
                      <option value="Coal Technology & Clean Energy">Coal Technology & Clean Energy</option>
                      <option value="Mining Engineering & Safety">Mining Engineering & Safety</option>
                      <option value="Environmental Sciences">Environmental Sciences</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Materials Science">Materials Science</option>
                      <option value="Process Engineering">Process Engineering</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Enhanced Rich Text Editor Section */}
              {editorMode === 'editor' && (
                <AdvancedProposalEditor
                  initialContent={editorContent}
                  onContentChange={handleEditorContentChange}
                  onWordCountChange={handleWordCountChange}
                  onCharacterCountChange={handleCharacterCountChange}
                  proposalTitle={proposalData.projectTitle}
                  showStats={true}
                  showExportButtons={true}
                />
              )}
              
              {/* Advanced Submit Section */}
              <div className="bg-white rounded-xl shadow-xl p-6 border border-orange-200">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Submit Proposal
                </h2>
                
                {!isSubmitting && !showEvaluation && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="text-black mb-2 flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pre-Submission Checklist
                      </h3>
                      <div className="grid md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-black">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          Project information completed
                        </div>
                        <div className="flex items-center gap-2 text-black">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          Content sections filled
                        </div>
                        <div className="flex items-center gap-2 text-black">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          Guidelines reviewed
                        </div>
                        <div className="flex items-center gap-2 text-black">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          Ready for AI analysis
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Submit for AI Analysis & Review
                    </button>
                  </div>
                )}
                
                {isSubmitting && (
                  <div className="relative overflow-hidden bg-orange-50 rounded-2xl border border-orange-200 shadow-2xl p-8">
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0">
                      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-orange-300/20 rounded-full animate-pulse animation-delay-1000"></div>
                      <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse animation-delay-2000"></div>
                      <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-orange-200/40 rounded-full animate-pulse animation-delay-3000"></div>
                      <div className="absolute top-1/3 left-2/3 w-1.5 h-1.5 bg-orange-500/25 rounded-full animate-pulse animation-delay-4000"></div>
                    </div>
                    
                    <div className="relative z-10 text-center">
                      {/* AI Loading Animation - Match Upload Loader */}
                      <div className="flex justify-center items-center mb-6">
                        <div className="relative">
                          {/* Orange-White-Green Ring with Visible White */}
                          <div className="w-20 h-20 rounded-full animate-spin" style={{
                            animationDuration: '2s',
                            background: 'conic-gradient(from 0deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '4px'
                          }}>
                            <div className="w-full h-full bg-orange-50 rounded-full"></div>
                          </div>
                          {/* Inner Ring with Visible White */}
                          <div className="absolute inset-2 w-16 h-16 rounded-full animate-spin" style={{
                            animationDuration: '1.5s', 
                            animationDirection: 'reverse',
                            background: 'conic-gradient(from 180deg, #f97316 0deg, #f97316 120deg, #ffffff 120deg, #ffffff 240deg, #22c55e 240deg, #22c55e 360deg)',
                            padding: '3px'
                          }}>
                            <div className="w-full h-full bg-orange-50 rounded-full"></div>
                          </div>
                          {/* Prism Logo in Center */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-orange-200 flex items-center justify-center">
                              <img 
                                src="/images/prism brand logo.png" 
                                alt="Prism Logo" 
                                className="w-6 h-6 object-contain animate-pulse"
                              />
                            </div>
                          </div>
                          {/* Simplified Particles */}
                          <div className="absolute -top-2 -left-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                          <div className="absolute -top-2 -right-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                          <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl text-black mb-2 tracking-tight">AI Analysis in Progress</h3>
                      <p className="text-black mb-6 text-lg">{submissionStage}</p>
                    </div>
                    
                    {/* Advanced Progress Bar */}
                    <div className="space-y-4">
                        <div className="flex justify-between text-black">
                          <span className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            Analysis Progress
                          </span>
                          <span className="text-black bg-orange-100 px-3 py-1 rounded-full text-sm border border-orange-200">
                            {Math.round(submissionProgress)}%
                          </span>
                        </div>
                        
                        <div className="relative">
                          {/* Clean Progress Bar - Match Upload Progress Bar */}
                          <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                            {/* Simple Clean Progress Fill */}
                            <div 
                              className="h-full transition-all duration-1000 ease-out rounded-full"
                              style={{ 
                                width: `${submissionProgress}%`,
                                background: submissionProgress <= 50 ? 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)' :
                                           'linear-gradient(90deg, #f97316 0%, #fb923c 50%, #22c55e 100%)'
                              }}
                            ></div>
                          </div>
                          
                          {/* Progress Stages Indicators */}
                          <div className="flex justify-between mt-3 px-1">
                            {['Analyzing', 'Processing', 'Evaluating', 'Complete'].map((stage, index) => {
                              const stageColors = ['text-orange-600', 'text-orange-500', 'text-green-600', 'text-green-700'];
                              const stageBgColors = ['bg-orange-600 border-orange-600', 'bg-orange-500 border-orange-500', 'bg-green-600 border-green-600', 'bg-green-700 border-green-700'];
                              
                              return (
                                <div key={stage} className={`flex flex-col items-center ${
                                  submissionProgress > (index * 25) ? stageColors[index] : 'text-black/40'
                                }`}>
                                  <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                                    submissionProgress > (index * 25) 
                                      ? `${stageBgColors[index]} animate-pulse` 
                                      : 'bg-white border-gray-300'
                                  }`}></div>
                                  <span className="text-xs mt-1">{stage}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                  </div>
                )}
                
                {showEvaluation && (
                  <div className="space-y-6">
                    <div className="text-center pb-6 border-b border-gray-200">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl text-black mb-2">AI Evaluation Complete</h3>
                      <p className="text-black">Your proposal has been analyzed and scored</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-black">Evaluation Scores</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm text-black">Technical Excellence</span>
                            <span className="text-black">{evaluationScores.technicalExcellence}/100</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm text-black">Financial Viability</span>
                            <span className="text-black">{evaluationScores.financialViability}/100</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm text-black">Strategic Alignment</span>
                            <span className="text-black">{evaluationScores.strategicAlignment}/100</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm text-black">Team Competency</span>
                            <span className="text-black">{evaluationScores.teamCompetency}/100</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <span className="text-sm text-black">Impact Potential</span>
                            <span className="text-black">{evaluationScores.impactPotential}/100</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-32 h-32 mb-4">
                          <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                          <div 
                            className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent animate-pulse"
                            style={{ 
                              background: `conic-gradient(from 0deg, #10b981 0%, #10b981 ${overallScore}%, transparent ${overallScore}%, transparent 100%)`
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl text-black">{overallScore}</div>
                              <div className="text-sm text-black">Overall</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm text-black mb-4">
                          Excellent proposal quality! Your submission shows strong technical merit and strategic alignment.
                        </p>
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          Continue to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>


        </div>
      </div>
    </div>
  );
}

export default function CreateProposal() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.USER]}>
      <CreateProposalContent />
    </ProtectedRoute>
  );
}
