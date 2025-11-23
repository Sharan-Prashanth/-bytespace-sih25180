'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdvancedProposalEditor from '../../components/ProposalEditor/editor (our files)/AdvancedProposalEditor';
import Chatbot from '../../components/Saarthi';
import { useToast, ToastContainer } from '../../components/ui (plate files)/toast';

function CreateNewProposalContent() {
  const router = useRouter();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const submissionInProgressRef = useRef(false);

  // Proposal Information State
  const [proposalInfo, setProposalInfo] = useState({
    title: '',
    fundingMethod: 'S&T_OF_MOC',
    principalImplementingAgency: '',
    subImplementingAgency: '',
    projectLeader: '',
    projectCoordinator: '',
    projectDurationMonths: '',
    projectOutlayLakhs: '',
  });

  // Validation State
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Form State - Track which forms have content
  const [formStatus, setFormStatus] = useState({
    'formi': false,
    'formia': false,
    'formix': false,
    'formx': false,
    'formxi': false,
    'formxii': false,
  });

  // Upload State for each form
  const [uploadedFiles, setUploadedFiles] = useState({
    'formi': null,
    'formia': null,
    'formix': null,
    'formx': null,
    'formxi': null,
    'formxii': null,
  });

  const [uploadingForm, setUploadingForm] = useState(null);
  const [extractingForm, setExtractingForm] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Draft State
  const [proposalId, setProposalId] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isManuallySaving, setIsManuallySaving] = useState(false);

  // Toast notifications
  const { toasts, removeToast, success, error, info } = useToast();

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStage, setSubmissionStage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedProposalId, setSubmittedProposalId] = useState('');

  // AI Assistant State
  const [showChatbot, setShowChatbot] = useState(false);

  // Editor Content State - Initial content for all forms
  const [editorInitialContent, setEditorInitialContent] = useState(null);

  // Signature State - For all forms
  const [signatures, setSignatures] = useState({
    headSignature: null, // Form IA
    institutionSeal: null, // Form IA
    projectLeaderSignature: null, // Forms IX, X, XI, XII
    projectCoordinatorSignature: null, // Forms IX, X, XI, XII
    financeOfficerSignature: null, // Forms XI, XII
  });

  // Form Configuration
  const FORM_CONFIGS = [
    {
      id: 'formi',
      label: 'Form I',
      title: 'Project Proposal for S&T Grant',
      pdfFile: '/files/FORM-I.pdf',
      docxFile: '/files/FORM-I.docx',
    },
    {
      id: 'formia',
      label: 'Form IA',
      title: 'Endorsement From',
      pdfFile: '/files/FORM-IA_NEW.pdf',
      docxFile: '/files/FORM-IA_NEW.docx',
    },
    {
      id: 'formix',
      label: 'Form IX',
      title: 'Equipment Details (Already Procured)',
      pdfFile: '/files/FORM-IX_NEW.pdf',
      docxFile: '/files/FORM-IX_NEW.docx',
    },
    {
      id: 'formx',
      label: 'Form X',
      title: 'Computer & Software Details',
      pdfFile: '/files/FORM-X_NEW.pdf',
      docxFile: '/files/FORM-X_NEW.docx',
    },
    {
      id: 'formxi',
      label: 'Form XI',
      title: 'Manpower Cost (Salary & Wages)',
      pdfFile: '/files/FORM-XI_NEW.pdf',
      docxFile: '/files/FORM-XI_NEW.docx',
    },
    {
      id: 'formxii',
      label: 'Form XII',
      title: 'Travel Expenditure (TA/DA)',
      pdfFile: '/files/FORM-XII_NEW.pdf',
      docxFile: '/files/FORM-XII_NEW.docx',
    },
  ];

  // Load existing draft on mount
  useEffect(() => {
    loadExistingDraft();
  }, []);

  // Validate proposal info
  useEffect(() => {
    validateProposalInfo();
  }, [proposalInfo]);

  // Check if all forms have content
  useEffect(() => {
    const allFormsComplete = Object.values(formStatus).every((status) => status === true);
    setIsFormValid(allFormsComplete && Object.keys(validationErrors).length === 0);
  }, [formStatus, validationErrors]);

  // Load existing draft from backend
  const loadExistingDraft = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/proposals/drafts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success && data.drafts && data.drafts.length > 0) {
        // Load the most recent draft
        const latestDraft = data.drafts[0];
        setProposalId(latestDraft._id);
        
        setProposalInfo({
          title: latestDraft.title || '',
          fundingMethod: latestDraft.researchFundingMethod || 'S&T_OF_MOC',
          principalImplementingAgency: latestDraft.principalImplementingAgency || '',
          subImplementingAgency: latestDraft.subImplementingAgency || '',
          projectLeader: latestDraft.projectLeader || '',
          projectCoordinator: latestDraft.projectCoordinator || '',
          projectDurationMonths: latestDraft.projectDuration || '',
          projectOutlayLakhs: latestDraft.projectOutlay || '',
        });

        // Load form status
        const status = {};
        latestDraft.forms?.forEach(form => {
          status[form.formKey] = true;
        });
        setFormStatus(status);

        // Load signatures from metadata
        if (latestDraft.metadata?.signatures) {
          setSignatures(latestDraft.metadata.signatures);
        }

        info('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      error('Failed to load draft');
    }
  };

  // Validate proposal information
  const validateProposalInfo = () => {
    const errors = {};

    if (!proposalInfo.title || proposalInfo.title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (proposalInfo.title.length > 150) {
      errors.title = 'Title must be 150 characters or less';
    }

    if (!proposalInfo.principalImplementingAgency || proposalInfo.principalImplementingAgency.trim().length === 0) {
      errors.principalImplementingAgency = 'Principal Implementing Agency is required';
    } else if (proposalInfo.principalImplementingAgency.length > 100) {
      errors.principalImplementingAgency = 'Agency name must be 100 characters or less';
    }

    if (!proposalInfo.subImplementingAgency || proposalInfo.subImplementingAgency.trim().length === 0) {
      errors.subImplementingAgency = 'Sub Implementing Agency is required';
    } else if (proposalInfo.subImplementingAgency.length > 100) {
      errors.subImplementingAgency = 'Agency name must be 100 characters or less';
    }

    if (!proposalInfo.projectLeader || proposalInfo.projectLeader.trim().length === 0) {
      errors.projectLeader = 'Project Leader is required';
    } else if (proposalInfo.projectLeader.length > 100) {
      errors.projectLeader = 'Name must be 100 characters or less';
    }

    if (!proposalInfo.projectCoordinator || proposalInfo.projectCoordinator.trim().length === 0) {
      errors.projectCoordinator = 'Project Coordinator is required';
    } else if (proposalInfo.projectCoordinator.length > 100) {
      errors.projectCoordinator = 'Name must be 100 characters or less';
    }

    if (!proposalInfo.projectDurationMonths || proposalInfo.projectDurationMonths < 1) {
      errors.projectDurationMonths = 'Duration must be at least 1 month';
    }

    if (!proposalInfo.projectOutlayLakhs || proposalInfo.projectOutlayLakhs < 0.01) {
      errors.projectOutlayLakhs = 'Outlay must be at least 0.01 lakhs';
    }

    setValidationErrors(errors);
  };

  // Handle proposal info change
  const handleInfoChange = (field, value) => {
    setProposalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-save draft to backend
  const autoSaveDraft = async () => {
    if (isAutoSaving) return;

    try {
      setIsAutoSaving(true);

      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/proposals/draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId,
          title: proposalInfo.title,
          researchFundingMethod: proposalInfo.fundingMethod,
          principalImplementingAgency: proposalInfo.principalImplementingAgency,
          subImplementingAgency: proposalInfo.subImplementingAgency,
          projectLeader: proposalInfo.projectLeader,
          projectCoordinator: proposalInfo.projectCoordinator,
          projectDuration: proposalInfo.projectDurationMonths,
          projectOutlay: proposalInfo.projectOutlayLakhs,
          signatures
        })
      });

      const data = await response.json();

      if (data.success) {
        if (!proposalId && data.proposal?._id) {
          setProposalId(data.proposal._id);
        }
        setLastSavedTime(new Date());
      }
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle auto-save from editor
  const handleAutoSave = useCallback(async (editorFormData) => {
    try {
      console.log('💾 handleAutoSave called with', editorFormData ? Object.keys(editorFormData).length : 0, 'forms');
      setIsAutoSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        return null;
      }

      const payload = {
        proposalId,
        title: proposalInfo.title,
        researchFundingMethod: proposalInfo.fundingMethod,
        principalImplementingAgency: proposalInfo.principalImplementingAgency,
        subImplementingAgency: proposalInfo.subImplementingAgency,
        projectLeader: proposalInfo.projectLeader,
        projectCoordinator: proposalInfo.projectCoordinator,
        projectDuration: proposalInfo.projectDurationMonths,
        projectOutlay: proposalInfo.projectOutlayLakhs,
        forms: editorFormData ? Object.keys(editorFormData).map(formKey => ({
          formKey,
          formLabel: FORM_CONFIGS.find(f => f.id === formKey)?.label || formKey,
          editorContent: editorFormData[formKey].content,
          wordCount: editorFormData[formKey].wordCount,
          characterCount: editorFormData[formKey].characterCount
        })) : undefined,
        signatures
      };

      console.log('📦 Auto-save payload:', {
        hasProposalId: !!proposalId,
        formsCount: payload.forms?.length || 0,
        formKeys: payload.forms?.map(f => f.formKey) || []
      });

      const response = await fetch('http://localhost:5000/api/proposals/draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        const savedProposalId = data.proposal?._id;
        console.log('✅ Draft saved successfully:', savedProposalId);
        if (!proposalId && savedProposalId) {
          setProposalId(savedProposalId);
        }
        setLastSavedTime(new Date());
        return savedProposalId || proposalId;
      } else {
        console.error('❌ Draft save failed:', data.message);
        return proposalId;
      }
    } catch (error) {
      console.error('❌ Error auto-saving draft:', error);
      return proposalId;
    } finally {
      setIsAutoSaving(false);
    }
  }, [proposalId, proposalInfo, formStatus, signatures, FORM_CONFIGS]);

  // Handle file upload for a form
  const handleFileUpload = async (formId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      error('Please upload a PDF or DOCX file');
      return;
    }

    try {
      setUploadingForm(formId);
      info('Uploading and extracting file...');

      const token = localStorage.getItem('token');
      if (!token) {
        error('Please log in to upload files');
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          setExtractingForm(formId);
          setExtractionProgress(50);

          // Extract content from file via backend
          const response = await fetch('http://localhost:5000/api/upload/extract-form', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file: reader.result,
              formId,
              fileName: file.name
            })
          });

          const data = await response.json();

          if (data.success) {
            setUploadedFiles((prev) => ({
              ...prev,
              [formId]: { name: file.name, extracted: true },
            }));

            // TODO: Load extracted content into editor
            // This would require passing the content to the editor ref
            
            setExtractionProgress(100);
            
            // Mark form as complete
            setFormStatus((prev) => ({
              ...prev,
              [formId]: true,
            }));

            success(`${FORM_CONFIGS.find(f => f.id === formId)?.label} content extracted successfully`);
            
            setTimeout(() => {
              setUploadingForm(null);
              setExtractingForm(null);
              setExtractionProgress(0);
              autoSaveDraft();
            }, 500);
          } else {
            throw new Error(data.message || 'Extraction failed');
          }
        } catch (err) {
          console.error('Error extracting file:', err);
          error('Error extracting file content. Please try again.');
          setUploadingForm(null);
          setExtractingForm(null);
          setExtractionProgress(0);
        }
      };

      reader.onerror = () => {
        error('Error reading file');
        setUploadingForm(null);
        setExtractingForm(null);
        setExtractionProgress(0);
      };
    } catch (err) {
      console.error('Error uploading file:', err);
      error('Error uploading file. Please try again.');
      setUploadingForm(null);
      setExtractingForm(null);
      setExtractionProgress(0);
    }
  };

  // Manual save draft (called from editor)
  const handleManualSave = async (editorFormData) => {
    if (isManuallySaving) return;

    try {
      setIsManuallySaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        error('Please log in to save');
        return;
      }

      const response = await fetch('http://localhost:5000/api/proposals/draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId,
          title: proposalInfo.title,
          researchFundingMethod: proposalInfo.fundingMethod,
          principalImplementingAgency: proposalInfo.principalImplementingAgency,
          subImplementingAgency: proposalInfo.subImplementingAgency,
          projectLeader: proposalInfo.projectLeader,
          projectCoordinator: proposalInfo.projectCoordinator,
          projectDuration: proposalInfo.projectDurationMonths,
          projectOutlay: proposalInfo.projectOutlayLakhs,
          forms: editorFormData ? Object.keys(editorFormData).map(formKey => ({
            formKey,
            formLabel: FORM_CONFIGS.find(f => f.id === formKey)?.label || formKey,
            editorContent: editorFormData[formKey].content,
            wordCount: editorFormData[formKey].wordCount,
            characterCount: editorFormData[formKey].characterCount
          })) : undefined,
          signatures
        })
      });

      const data = await response.json();

      if (data.success) {
        if (!proposalId && data.proposal?._id) {
          setProposalId(data.proposal._id);
        }
        setLastSavedTime(new Date());
        success('Draft saved successfully');
      } else {
        error(data.message || 'Failed to save draft');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      error('Failed to save draft');
    } finally {
      setIsManuallySaving(false);
    }
  };

  // Remove uploaded form
  const handleRemoveForm = async (formId) => {
    try {
      info('Removing form...');

      // Mock: Delete from S3 (real API call would go here)
      // const fileUrl = uploadedFiles[formId]?.url;
      // if (fileUrl) {
      //   await fetch('/api/upload/delete', {
      //     method: 'DELETE',
      //     body: JSON.stringify({ url: fileUrl }),
      //   });
      // }

      // Clear uploaded file
      setUploadedFiles((prev) => ({
        ...prev,
        [formId]: null,
      }));

      // Clear form status
      setFormStatus((prev) => ({
        ...prev,
        [formId]: false,
      }));

      success(`${FORM_CONFIGS.find(f => f.id === formId)?.label} removed successfully`);
      autoSaveDraft();
    } catch (err) {
      console.error('Error removing form:', err);
      error('Error removing form. Please try again.');
    }
  };

  // Handle form content change from editor
  const handleFormContentChange = (formId, hasContent) => {
    setFormStatus((prev) => ({
      ...prev,
      [formId]: hasContent,
    }));
  };

  // Handle signature changes from editor
  const handleSignatureChange = (signatureType, signatureData) => {
    setSignatures((prev) => ({
      ...prev,
      [signatureType]: signatureData,
    }));
  };

  // Handle seal changes from editor
  const handleSealChange = (sealData) => {
    setSignatures((prev) => ({
      ...prev,
      institutionSeal: sealData,
    }));
  };

  // Upload all base64 images to S3 (mock implementation)
  const uploadImagesToS3 = useCallback(async (editorContent) => {
    try {
      info('Uploading images to cloud storage...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare images for upload (only base64 strings need upload)
      const imagesToUpload = [];
      
      Object.entries(signatures).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.startsWith('data:image')) {
          imagesToUpload.push({ key, image: value, fileName: `${key}_${Date.now()}` });
        }
      });

      if (imagesToUpload.length === 0) {
        // No images to upload
        return signatures;
      }

      // Upload all images to backend
      const response = await fetch('http://localhost:5000/api/upload/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: imagesToUpload.map(img => ({ image: img.image, fileName: img.fileName })),
          folder: 'signatures'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Replace base64 with uploaded URLs
      const uploadedUrls = { ...signatures };
      data.data.successful.forEach((result, index) => {
        const imageKey = imagesToUpload[index].key;
        uploadedUrls[imageKey] = result.url;
      });

      success('Images uploaded successfully');
      return uploadedUrls;
    } catch (err) {
      console.error('Error uploading images:', err);
      error('Failed to upload images');
      throw err;
    }
  }, [signatures, info, success, error]);

  // Handle chat message
  const handleSendMessage = (message) => {
    // Add user message
    const userMessage = {
      type: 'user',
      content: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Mock AI response
    setTimeout(() => {
      const aiResponse = {
        type: 'ai',
        content: 'I understand your question. Let me help you with that...\n\n[This is a mock response. Actual AI integration will be added later.]',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  // Mock: Submit proposal
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submissionInProgressRef.current) return;
    if (!isFormValid) return;

    try {
      submissionInProgressRef.current = true;
      setIsSubmitting(true);
      setSubmissionProgress(0);

      const token = localStorage.getItem('token');
      if (!token) {
        error('Please log in to submit');
        return;
      }

      setSubmissionStage('Validating proposal information...');
      setSubmissionProgress(10);

      // Step 0: Save as draft first if no proposalId exists
      let currentProposalId = proposalId;
      if (!currentProposalId) {
        setSubmissionStage('Saving draft...');
        setSubmissionProgress(15);
        
        const editorFormDataTemp = editorRef.current?.getFormData?.() || {};
        currentProposalId = await handleAutoSave(editorFormDataTemp);
        
        if (!currentProposalId) {
          throw new Error('Failed to create draft. Please try again.');
        }
      }

      // Step 1: Upload all signature images to S3
      setSubmissionStage('Uploading signature images...');
      setSubmissionProgress(20);
      const uploadedSignatures = await uploadImagesToS3();

      // Step 2: Get editor form data
      setSubmissionStage('Preparing form data...');
      setSubmissionProgress(30);
      const editorFormData = editorRef.current?.getFormData?.() || {};

      // Step 3: Submit proposal with uploaded signatures
      setSubmissionStage('Submitting proposal...');
      setSubmissionProgress(50);

      // Prepare submission payload
      const submissionPayload = {
        forms: Object.keys(editorFormData).map(formKey => ({
          formKey,
          formLabel: FORM_CONFIGS.find(f => f.id === formKey)?.label || formKey,
          editorContent: editorFormData[formKey].content,
          wordCount: editorFormData[formKey].wordCount,
          characterCount: editorFormData[formKey].characterCount
        })),
        signatures: uploadedSignatures
      };

      console.log('📦 Submission payload:', {
        proposalId: currentProposalId,
        formsCount: submissionPayload.forms.length,
        formKeys: submissionPayload.forms.map(f => f.formKey),
        signaturesCount: Object.keys(uploadedSignatures).length,
        signatureKeys: Object.keys(uploadedSignatures)
      });

      const response = await fetch(`http://localhost:5000/api/proposals/${currentProposalId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionPayload)
      });

      const data = await response.json();

      console.log('📤 Submission response:', {
        success: data.success,
        message: data.message,
        statusCode: response.status,
        proposal: data.proposal ? {
          id: data.proposal._id,
          status: data.proposal.status,
          formsCount: data.proposal.forms?.length
        } : null
      });

      if (!data.success) {
        console.error('❌ Submission failed:', data.message);
        throw new Error(data.message || 'Submission failed');
      }

      console.log('✅ Proposal submitted successfully:', data.proposal);

      setSubmissionStage('AI Evaluation: Checking novelty and originality...');
      setSubmissionProgress(65);

      // TODO: Trigger AI evaluation endpoint
      // await fetch(`http://localhost:5000/api/proposals/${proposalId}/ai-evaluation/trigger`, ...)

      setSubmissionStage('AI Evaluation: Verifying compliance with guidelines...');
      setSubmissionProgress(75);

      setSubmissionStage('AI Evaluation: Assessing technical feasibility...');
      setSubmissionProgress(85);

      setSubmissionStage('Finalizing submission...');
      setSubmissionProgress(95);

      setSubmissionProgress(100);
      setSubmissionStage('Submission complete!');

      const submittedProposalNumber = data.proposal?.proposalNumber || 'Unknown';
      setSubmittedProposalId(submittedProposalNumber);

      // Show success modal
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      error(error.message || 'Error submitting proposal. Please try again.');
      setIsSubmitting(false);
      submissionInProgressRef.current = false;
    }
  };

  // Handle success modal close and redirect
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create New Proposal</h1>
              <p className="text-blue-100 mt-1">Fill in all required information and complete all 6 forms</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Guidelines & Templates Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-orange-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-black mb-2">Guidelines & Templates</h2>
              <p className="text-black mb-4">
                Please read the guidelines carefully. All 6 forms are mandatory for submission.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/files/S&T-Guidelines-MoC.pdf"
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Guidelines (PDF)
                </a>
                <a
                  href="/files/proposal-template.docx"
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Proposal Template (DOCX)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Information Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-orange-200">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Proposal Information
            <span className="text-sm text-red-600 font-normal">(All fields required)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-black mb-2">
                Project Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={proposalInfo.title}
                onChange={(e) => handleInfoChange('title', e.target.value)}
                maxLength={150}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter project title (max 150 characters)"
              />
              <div className="flex justify-between mt-1">
                <span className="text-sm text-red-600">{validationErrors.title || ''}</span>
                <span className="text-sm text-black">{proposalInfo.title.length}/150</span>
              </div>
            </div>

            {/* Funding Method */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Funding Method <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="S&T_OF_MOC"
                    checked={proposalInfo.fundingMethod === 'S&T_OF_MOC'}
                    onChange={(e) => handleInfoChange('fundingMethod', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-black">S&T of MoC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="R&D_OF_CIL"
                    checked={proposalInfo.fundingMethod === 'R&D_OF_CIL'}
                    onChange={(e) => handleInfoChange('fundingMethod', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-black">R&D of CIL</span>
                </label>
              </div>
            </div>

            {/* Principal Implementing Agency */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Principal Implementing Agency <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={proposalInfo.principalImplementingAgency}
                onChange={(e) => handleInfoChange('principalImplementingAgency', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter agency name"
              />
              {validationErrors.principalImplementingAgency && (
                <span className="text-sm text-red-600">{validationErrors.principalImplementingAgency}</span>
              )}
            </div>

            {/* Sub Implementing Agency */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Sub Implementing Agency <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={proposalInfo.subImplementingAgency}
                onChange={(e) => handleInfoChange('subImplementingAgency', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter agency name"
              />
              {validationErrors.subImplementingAgency && (
                <span className="text-sm text-red-600">{validationErrors.subImplementingAgency}</span>
              )}
            </div>

            {/* Project Leader */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Project Leader <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={proposalInfo.projectLeader}
                onChange={(e) => handleInfoChange('projectLeader', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter leader name"
              />
              {validationErrors.projectLeader && (
                <span className="text-sm text-red-600">{validationErrors.projectLeader}</span>
              )}
            </div>

            {/* Project Coordinator */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Project Coordinator <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={proposalInfo.projectCoordinator}
                onChange={(e) => handleInfoChange('projectCoordinator', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter coordinator name"
              />
              {validationErrors.projectCoordinator && (
                <span className="text-sm text-red-600">{validationErrors.projectCoordinator}</span>
              )}
            </div>

            {/* Project Duration */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Project Duration (Months) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={proposalInfo.projectDurationMonths}
                onChange={(e) => handleInfoChange('projectDurationMonths', e.target.value)}
                min="1"
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter duration in months"
              />
              {validationErrors.projectDurationMonths && (
                <span className="text-sm text-red-600">{validationErrors.projectDurationMonths}</span>
              )}
            </div>

            {/* Project Outlay */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Project Outlay (Lakhs) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={proposalInfo.projectOutlayLakhs}
                onChange={(e) => handleInfoChange('projectOutlayLakhs', e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter outlay in lakhs"
              />
              {validationErrors.projectOutlayLakhs && (
                <span className="text-sm text-red-600">{validationErrors.projectOutlayLakhs}</span>
              )}
            </div>
          </div>
        </div>

        {/* Forms Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-orange-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Proposal Forms (All 6 Required)
            </h2>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-black text-sm">
              <strong>Note:</strong> You can upload any subset of forms (1-6) and their content will be loaded into the editor. 
              You can then make minor corrections directly in the editor, or you can choose to fill all forms directly in the editor without uploading.
            </p>
          </div>

          {/* Form Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {FORM_CONFIGS.map((form) => (
              <div
                key={form.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  formStatus[form.id]
                    ? 'border-green-500 bg-green-50'
                    : 'border-orange-200 bg-white hover:border-orange-400'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-black">{form.label}</h3>
                    <p className="text-sm text-black">{form.title}</p>
                  </div>
                  {formStatus[form.id] && (
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                {/* Download Templates */}
                <div className="flex gap-2 mb-3">
                  <a
                    href={form.pdfFile}
                    download
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                    </svg>
                    PDF
                  </a>
                  <a
                    href={form.docxFile}
                    download
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                    </svg>
                    DOCX
                  </a>
                </div>

                {/* Upload Section */}
                <div className="border-t border-orange-200 pt-3">
                  {/* Extraction Progress */}
                  {extractingForm === form.id && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-black">Extracting content...</span>
                        <span className="text-xs text-black">{extractionProgress}%</span>
                      </div>
                      <div className="w-full bg-orange-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${extractionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadedFiles[form.id] ? (
                    <div className="space-y-2">
                      <div className="text-sm text-black">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold">Uploaded:</span>
                        </div>
                        <p className="text-xs text-black truncate">{uploadedFiles[form.id].name}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveForm(form.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-all font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => handleFileUpload(form.id, e)}
                        disabled={uploadingForm === form.id || extractingForm === form.id}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm rounded-lg hover:from-orange-600 hover:to-red-700 cursor-pointer transition-all disabled:opacity-50">
                        {uploadingForm === form.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Form
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Editor Integration */}
          <div className="border-t-2 border-orange-200 pt-6">
            <h3 className="text-lg font-bold text-black mb-4">Form Editor</h3>
            <AdvancedProposalEditor
              ref={editorRef}
              proposalId={null}
              mode="create"
              proposalTitle={proposalInfo.title || 'Untitled Proposal'}
              showStats={false}
              initialContent={editorInitialContent}
              signatures={signatures}
              onFormStatusChange={handleFormContentChange}
              onSignatureChange={handleSignatureChange}
              onSealChange={handleSealChange}
              onManualSave={handleManualSave}
              onAutoSave={handleAutoSave}
              onContentChange={(content) => {
                // Content changes handled by auto-save
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-lg p-6 sticky bottom-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black mb-1">
                <strong>Form Status:</strong> {Object.values(formStatus).filter((s) => s).length} of 6 completed
              </p>
              {!isFormValid && (
                <p className="text-sm text-red-600">
                  Please complete all required fields and all 6 forms before submitting
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Proposal'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Toggle Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-2xl hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center z-40"
        title="AI Assistant - SAARTHI"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* AI Chatbot */}
      <Chatbot
        showSaarthi={showChatbot}
        setShowSaarthi={setShowChatbot}
        context="create"
      />

      {/* Submission Progress Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-orange-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Submitting Proposal</h3>
              <p className="text-black mb-4">{submissionStage}</p>
              <div className="w-full bg-orange-100 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${submissionProgress}%` }}
                />
              </div>
              <p className="text-sm text-black">{submissionProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Proposal Submitted Successfully!</h3>
              <p className="text-black mb-4">
                Your proposal has been submitted and is now under AI evaluation.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-black mb-1">
                  <strong>Proposal ID:</strong>
                </p>
                <p className="text-lg font-bold text-orange-600">{submittedProposalId}</p>
              </div>
              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-semibold shadow-lg"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateNewProposal() {
  return (
    <ProtectedRoute>
      <CreateNewProposalContent />
    </ProtectedRoute>
  );
}
