'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Chatbot from '../../components/Saarthi';
import { useToast, ToastContainer } from '../../components/ui (plate files)/toast';
import ProposalStorage from '../../utils/proposalStorage';
import { createProposal, updateProposal, submitProposal, getProposalById, getProposals } from '../../utils/proposalApi';
import '../../utils/clearProposalStorage'; // Enable global clearProposalStorage() function

// Import new modular components
import Header from '../../components/create-page/Header';
import Guidelines from '../../components/create-page/Guidelines';
import PreSubmissionInfo from '../../components/create-page/PreSubmissionInfo';
import ProposalInformation from '../../components/create-page/ProposalInformation';
import InitialDocumentsUpload from '../../components/create-page/InitialDocumentsUpload';
import AdditionalFormsUpload from '../../components/create-page/AdditionalFormsUpload';
import SupportingDocumentsUpload from '../../components/create-page/SupportingDocumentsUpload';
import ConfirmationModal from '../../components/create-page/ConfirmationModal';
import SubmissionSuccessModal from '../../components/create-page/SubmissionSuccessModal';

// Lazy load heavy components
const FormIEditor = lazy(() => import('../../components/create-page/FormIEditor'));

function CreateNewProposalContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toasts, removeToast, success, error, info } = useToast();
  
  // Storage instance
  const storageRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);

  // Proposal metadata
  const [proposalId, setProposalId] = useState(null);
  const [proposalCode, setProposalCode] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(0.1);
  const [isLoading, setIsLoading] = useState(true);

  // Proposal Information State
  const [proposalInfo, setProposalInfo] = useState({
    title: '',
    fundingMethod: 'S&T of MoC',
    principalImplementingAgency: '',
    subImplementingAgency: '',
    projectLeader: '',
    projectCoordinator: '',
    projectDurationMonths: '',
    projectOutlayLakhs: '',
  });

  // Validation State
  const [validationErrors, setValidationErrors] = useState({});

  // Initial Documents State (covering letter and CV)
  const [initialDocuments, setInitialDocuments] = useState({
    coveringLetter: null,
    cv: null,
  });

  // Form I Editor Content
  const [formIContent, setFormIContent] = useState(null);
  const [formIUploadedPdf, setFormIUploadedPdf] = useState(null);

  // Additional Forms State (IA, IX, X, XI, XII)
  const [additionalForms, setAdditionalForms] = useState({
    formia: null,
    formix: null,
    formx: null,
    formxi: null,
    formxii: null,
  });

  // Supporting Documents State
  const [supportingDocuments, setSupportingDocuments] = useState({
    orgDetails: null,
    infrastructure: null,
    expertise: null,
    rdComponent: null,
    benefits: null,
    webSurvey: null,
    researchContent: null,
    collaboration: null,
  });

  // Save State
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);

  // Modal States
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedProposalId, setSubmittedProposalId] = useState('');

  // Chatbot State
  const [showChatbot, setShowChatbot] = useState(false);

  // Helper function to normalize fundingMethod value
  const normalizeFundingMethod = (value) => {
    // Map old enum values to new ones
    const mapping = {
      'S&T_OF_MOC': 'S&T of MoC',
      'R&D_OF_CIL': 'R&D of CIL',
      'S&T of MoC': 'S&T of MoC',
      'R&D of CIL': 'R&D of CIL'
    };
    return mapping[value] || 'S&T of MoC';
  };

  // Initialize storage and load draft on mount
  useEffect(() => {
    const initializeProposal = async () => {
      try {
        setIsLoading(true);
        
        // Initialize storage
        storageRef.current = new ProposalStorage();
        
        // Check if there's an existing draft in localStorage
        const localData = storageRef.current.initialize('new');
        
        // Validate and fix fundingMethod in local storage
        if (localData?.proposalInfo?.fundingMethod) {
          const normalized = normalizeFundingMethod(localData.proposalInfo.fundingMethod);
          if (normalized !== localData.proposalInfo.fundingMethod) {
            // Update localStorage with correct value
            storageRef.current.save({
              proposalInfo: {
                ...localData.proposalInfo,
                fundingMethod: normalized
              }
            }, false);
          }
        }
        
        // Try to load latest draft from backend
        try {
          const response = await getProposals({ status: 'DRAFT', limit: 1 });
          if (response.data.proposals && response.data.proposals.length > 0) {
            const draft = response.data.proposals[0];
            
            // Load from backend
            const fullDraft = await getProposalById(draft._id);
            const draftData = fullDraft.data;
            
            // Update state
            setProposalId(draftData._id);
            setProposalCode(draftData.proposalCode);
            setCurrentVersion(draftData.currentVersion);
            setProposalInfo({
              title: draftData.title || '',
              fundingMethod: normalizeFundingMethod(draftData.fundingMethod || 'S&T of MoC'),
              principalImplementingAgency: draftData.principalAgency || '',
              subImplementingAgency: draftData.subAgencies?.[0] || '',
              projectLeader: draftData.projectLeader || '',
              projectCoordinator: draftData.projectCoordinator || '',
              projectDurationMonths: draftData.durationMonths || '',
              projectOutlayLakhs: draftData.outlayLakhs || '',
            });
            
            // Set form content
            if (draftData.forms?.formI) {
              setFormIContent(draftData.forms.formI);
            }
            
            // Set documents from supportingDocs array
            const docMap = {};
            if (draftData.supportingDocs && draftData.supportingDocs.length > 0) {
              draftData.supportingDocs.forEach(doc => {
                docMap[doc.formName] = {
                  name: doc.fileName || doc.formName,
                  url: doc.fileUrl,
                  s3Key: doc.s3Key,
                  size: doc.fileSize,
                  uploadedAt: doc.uploadedAt
                };
              });
              
              // Check for Form I PDF upload
              if (docMap.formIPdf) {
                setFormIUploadedPdf(docMap.formIPdf);
              }
              
              // Map to component structure - Initial Documents
              if (docMap.coveringLetter) setInitialDocuments(prev => ({ ...prev, coveringLetter: docMap.coveringLetter }));
              if (docMap.cv) setInitialDocuments(prev => ({ ...prev, cv: docMap.cv }));
              
              // Additional forms
              if (docMap.formia) setAdditionalForms(prev => ({ ...prev, formia: docMap.formia }));
              if (docMap.formix) setAdditionalForms(prev => ({ ...prev, formix: docMap.formix }));
              if (docMap.formx) setAdditionalForms(prev => ({ ...prev, formx: docMap.formx }));
              if (docMap.formxi) setAdditionalForms(prev => ({ ...prev, formxi: docMap.formxi }));
              if (docMap.formxii) setAdditionalForms(prev => ({ ...prev, formxii: docMap.formxii }));
              
              // Supporting documents
              if (docMap.orgDetails) setSupportingDocuments(prev => ({ ...prev, orgDetails: docMap.orgDetails }));
              if (docMap.infrastructure) setSupportingDocuments(prev => ({ ...prev, infrastructure: docMap.infrastructure }));
              if (docMap.expertise) setSupportingDocuments(prev => ({ ...prev, expertise: docMap.expertise }));
              if (docMap.rdComponent) setSupportingDocuments(prev => ({ ...prev, rdComponent: docMap.rdComponent }));
              if (docMap.benefits) setSupportingDocuments(prev => ({ ...prev, benefits: docMap.benefits }));
              if (docMap.webSurvey) setSupportingDocuments(prev => ({ ...prev, webSurvey: docMap.webSurvey }));
              if (docMap.researchContent) setSupportingDocuments(prev => ({ ...prev, researchContent: docMap.researchContent }));
              if (docMap.collaboration) setSupportingDocuments(prev => ({ ...prev, collaboration: docMap.collaboration }));
            }
            
            // Update storage with loaded data
            storageRef.current.updateProposalMeta(draftData._id, draftData.proposalCode);
            storageRef.current.save({
              proposalInfo: {
                title: draftData.title || '',
                fundingMethod: normalizeFundingMethod(draftData.fundingMethod || 'S&T of MoC'),
                principalImplementingAgency: draftData.principalAgency || '',
                subImplementingAgency: draftData.subAgencies?.[0] || '',
                projectLeader: draftData.projectLeader || '',
                projectCoordinator: draftData.projectCoordinator || '',
                projectDurationMonths: draftData.durationMonths || '',
                projectOutlayLakhs: draftData.outlayLakhs || '',
              },
              formIContent: draftData.forms?.formI,
              formIUploadedPdf: docMap.formIPdf || null,
              initialDocuments: {
                coveringLetter: docMap.coveringLetter || null,
                cv: docMap.cv || null
              },
              additionalForms: {
                formia: docMap.formia || null,
                formix: docMap.formix || null,
                formx: docMap.formx || null,
                formxi: docMap.formxi || null,
                formxii: docMap.formxii || null
              },
              supportingDocuments: {
                orgDetails: docMap.orgDetails || null,
                infrastructure: docMap.infrastructure || null,
                expertise: docMap.expertise || null,
                rdComponent: docMap.rdComponent || null,
                benefits: docMap.benefits || null,
                webSurvey: docMap.webSurvey || null,
                researchContent: docMap.researchContent || null,
                collaboration: docMap.collaboration || null
              },
              currentVersion: draftData.currentVersion,
            }, false);
            
            info('Draft proposal loaded');
          }
        } catch (err) {
          console.log('No existing draft found, starting fresh');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        error('Failed to initialize proposal');
        setIsLoading(false);
      }
    };
    
    initializeProposal();
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Setup auto-save timer (every 30 seconds)
  useEffect(() => {
    if (isLoading) return;
    
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChangesRef.current && !isAutoSaving) {
        handleAutoSave();
      }
    }, 30000); // 30 seconds
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [isLoading]);

  // Handle page exit/navigation - save to backend
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
        await saveToBackend();
      }
    };
    
    const handleRouteChange = async () => {
      if (hasUnsavedChangesRef.current) {
        await saveToBackend();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events?.on('routeChangeStart', handleRouteChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // Validate proposal info
  useEffect(() => {
    if (!isLoading) {
      validateProposalInfo();
    }
  }, [proposalInfo, isLoading]);

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
    }

    if (!proposalInfo.subImplementingAgency || proposalInfo.subImplementingAgency.trim().length === 0) {
      errors.subImplementingAgency = 'Sub Implementing Agency is required';
    }

    if (!proposalInfo.projectLeader || proposalInfo.projectLeader.trim().length === 0) {
      errors.projectLeader = 'Project Leader is required';
    }

    if (!proposalInfo.projectCoordinator || proposalInfo.projectCoordinator.trim().length === 0) {
      errors.projectCoordinator = 'Project Coordinator is required';
    }

    if (!proposalInfo.projectDurationMonths || proposalInfo.projectDurationMonths < 1) {
      errors.projectDurationMonths = 'Duration must be at least 1 month';
    }

    if (!proposalInfo.projectOutlayLakhs || proposalInfo.projectOutlayLakhs < 0.01) {
      errors.projectOutlayLakhs = 'Outlay must be at least 0.01 lakhs';
    }

    setValidationErrors(errors);
  };

  // Auto-save to localStorage
  const handleAutoSave = () => {
    if (!storageRef.current || isAutoSaving) return;
    
    setIsAutoSaving(true);
    
    try {
      // Save to localStorage with version increment
      const savedData = storageRef.current.save({
        proposalInfo,
        initialDocuments,
        formIContent,
        additionalForms,
        supportingDocuments,
      }, true); // increment version
      
      setCurrentVersion(savedData.currentVersion);
      setLastSavedTime(new Date());
      hasUnsavedChangesRef.current = false;
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Save to backend (on navigation/exit)
  const saveToBackend = async () => {
    if (!storageRef.current || isSavingToBackend) return;
    
    setIsSavingToBackend(true);
    
    try {
      const data = storageRef.current.getData();
      
      // Prepare supporting docs array
      const supportingDocs = [];
      
      // Add Form I uploaded PDF if exists
      if (formIUploadedPdf) {
        supportingDocs.push({
          formName: 'formIPdf',
          fileName: formIUploadedPdf.name,
          fileUrl: formIUploadedPdf.url,
          s3Key: formIUploadedPdf.s3Key,
          fileSize: formIUploadedPdf.size
        });
      }
      
      // Add initial documents
      if (initialDocuments.coveringLetter) {
        supportingDocs.push({
          formName: 'coveringLetter',
          fileName: initialDocuments.coveringLetter.name,
          fileUrl: initialDocuments.coveringLetter.url,
          s3Key: initialDocuments.coveringLetter.s3Key,
          fileSize: initialDocuments.coveringLetter.size
        });
      }
      if (initialDocuments.cv) {
        supportingDocs.push({
          formName: 'cv',
          fileName: initialDocuments.cv.name,
          fileUrl: initialDocuments.cv.url,
          s3Key: initialDocuments.cv.s3Key,
          fileSize: initialDocuments.cv.size
        });
      }
      
      // Add additional forms
      Object.entries(additionalForms).forEach(([key, value]) => {
        if (value) {
          supportingDocs.push({
            formName: key,
            fileName: value.name,
            fileUrl: value.url,
            s3Key: value.s3Key,
            fileSize: value.size
          });
        }
      });
      
      // Add supporting documents
      Object.entries(supportingDocuments).forEach(([key, value]) => {
        if (value) {
          supportingDocs.push({
            formName: key,
            fileName: value.name,
            fileUrl: value.url,
            s3Key: value.s3Key,
            fileSize: value.size
          });
        }
      });
      
      const proposalData = {
        title: proposalInfo.title,
        fundingMethod: normalizeFundingMethod(proposalInfo.fundingMethod),
        principalAgency: proposalInfo.principalImplementingAgency,
        subAgencies: proposalInfo.subImplementingAgency ? [proposalInfo.subImplementingAgency] : [],
        projectLeader: proposalInfo.projectLeader,
        projectCoordinator: proposalInfo.projectCoordinator,
        durationMonths: parseInt(proposalInfo.projectDurationMonths) || 0,
        outlayLakhs: parseFloat(proposalInfo.projectOutlayLakhs) || 0,
        forms: {
          formI: formIContent
        },
        supportingDocs
      };
      
      // Debug log to verify correct values
      console.log('Sending proposal data to backend:', {
        fundingMethod: proposalData.fundingMethod,
        title: proposalData.title
      });
      
      if (proposalId) {
        // Update existing proposal
        await updateProposal(proposalId, proposalData);
      } else {
        // Create new proposal
        const response = await createProposal(proposalData);
        const newProposal = response.data;
        
        setProposalId(newProposal._id);
        setProposalCode(newProposal.proposalCode);
        
        // Update storage with new IDs
        storageRef.current.updateProposalMeta(newProposal._id, newProposal.proposalCode);
      }
      
      hasUnsavedChangesRef.current = false;
    } catch (err) {
      console.error('Backend save error:', err);
      throw err;
    } finally {
      setIsSavingToBackend(false);
    }
  };

  // Handle proposal info change
  const handleInfoChange = (field, value) => {
    // Normalize fundingMethod value if it's being changed
    const normalizedValue = field === 'fundingMethod' ? normalizeFundingMethod(value) : value;
    
    setProposalInfo((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
  };

  // Handle initial document upload
  const handleInitialDocumentUpload = (docType, docData) => {
    setInitialDocuments((prev) => ({
      ...prev,
      [docType]: docData,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    success(`${docType === 'coveringLetter' ? 'Covering Letter' : 'CV'} uploaded successfully`);
  };

  // Handle initial document remove
  const handleInitialDocumentRemove = (docType) => {
    setInitialDocuments((prev) => ({
      ...prev,
      [docType]: null,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    info(`${docType === 'coveringLetter' ? 'Covering Letter' : 'CV'} removed`);
  };

  // Handle Form I content change
  const handleFormIContentChange = (data) => {
    setFormIContent(data);
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
  };
  
  // Handle Form I PDF upload
  useEffect(() => {
    if (formIUploadedPdf) {
      hasUnsavedChangesRef.current = true;
      storageRef.current?.markDirty();
    }
  }, [formIUploadedPdf]);

  // Handle Form I save (manual save button)
  const handleFormISave = async (data, isAutoSave = false) => {
    if (!isAutoSave) {
      // Manual save - trigger immediate auto-save
      handleAutoSave();
      success('Form I saved successfully');
    }
  };

  // Handle additional form upload
  const handleAdditionalFormUpload = (formId, formData) => {
    setAdditionalForms((prev) => ({
      ...prev,
      [formId]: formData,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    success(`${formId.toUpperCase()} uploaded successfully`);
  };

  // Handle additional form remove
  const handleAdditionalFormRemove = (formId) => {
    setAdditionalForms((prev) => ({
      ...prev,
      [formId]: null,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    info(`${formId.toUpperCase()} removed`);
  };

  // Handle supporting document upload
  const handleSupportingDocumentUpload = (docId, docData) => {
    setSupportingDocuments((prev) => ({
      ...prev,
      [docId]: docData,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    success('Supporting document uploaded successfully');
  };

  // Handle supporting document remove
  const handleSupportingDocumentRemove = (docId) => {
    setSupportingDocuments((prev) => ({
      ...prev,
      [docId]: null,
    }));
    hasUnsavedChangesRef.current = true;
    storageRef.current?.markDirty();
    info('Supporting document removed');
  };

  // Handle back to dashboard
  const handleBackToDashboard = async () => {
    // Save to backend before navigating
    try {
      await saveToBackend();
      router.push('/dashboard');
    } catch (err) {
      error('Failed to save proposal before leaving');
    }
  };

  // Validate all required fields before submission
  const validateSubmission = () => {
    const errors = [];

    // Check proposal info
    if (Object.keys(validationErrors).length > 0) {
      errors.push('Please complete all required fields in Proposal Information');
    }

    // Check initial documents
    if (!initialDocuments.coveringLetter) {
      errors.push('Covering Letter is required');
    }
    if (!initialDocuments.cv) {
      errors.push('CV / Resume is required');
    }

    // Check Form I content
    if (!formIContent || !formIContent.formi || !formIContent.formi.content || formIContent.formi.content.length === 0) {
      errors.push('Form I must be completed');
    }

    // Check mandatory additional forms
    if (!additionalForms.formia) {
      errors.push('Form IA (Endorsement Form) is required');
    }
    if (!additionalForms.formxi) {
      errors.push('Form XI (Manpower Cost) is required');
    }
    if (!additionalForms.formxii) {
      errors.push('Form XII (Travel Expenditure) is required');
    }

    // Check mandatory supporting documents
    const mandatorySupportingDocs = [
      'orgDetails',
      'infrastructure',
      'expertise',
      'rdComponent',
      'benefits',
      'webSurvey',
      'researchContent'
    ];

    mandatorySupportingDocs.forEach(docId => {
      if (!supportingDocuments[docId]) {
        errors.push(`Supporting document for ${docId} is required`);
      }
    });

    return errors;
  };

  // Handle submit button click
  const handleSubmitClick = () => {
    const errors = validateSubmission();

    if (errors.length > 0) {
      // Create formatted error message
      const errorMessage = errors.join('\n');
      error(errorMessage);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  // Handle final submission after confirmation
  const handleFinalSubmission = async () => {
    setShowConfirmationModal(false);

    try {
      // First, save to backend if not already saved
      if (!proposalId) {
        await saveToBackend();
      }
      
      // Mock AI evaluation process
      info('AI evaluation in progress...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Submit proposal (creates version 1.0)
      const response = await submitProposal(proposalId, {
        commitMessage: 'Initial submission'
      });
      
      success('Proposal submitted successfully!');
      setSubmittedProposalId(response.data.proposalCode || proposalId);
      
      // Clear local storage after successful submission
      storageRef.current?.clear();
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission error:', err);
      error(`Failed to submit proposal: ${err.message || 'Please try again'}`);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black text-lg">Loading proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header with back button */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 text-sm border border-black/20 text-black rounded-lg hover:bg-black/5 transition-colors"
            >
              ← Back to Dashboard
            </button>
            {proposalCode && (
              <div className="text-sm text-black/60">
                Code: <span className="font-mono font-semibold">{proposalCode}</span>
                {' '} | Version: <span className="font-semibold">{currentVersion}</span>
              </div>
            )}
          </div>
          {lastSavedTime && (
            <div className="text-sm text-black/60">
              {isAutoSaving ? 'Saving...' : `Last saved: ${lastSavedTime.toLocaleTimeString()}`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Guidelines */}
        <Guidelines />

        {/* Pre-submission info */}
        <PreSubmissionInfo />

        {/* Proposal Information */}
        <ProposalInformation
          proposalInfo={proposalInfo}
          validationErrors={validationErrors}
          onChange={handleInfoChange}
        />

        {/* Initial Documents */}
        <InitialDocumentsUpload
          documents={initialDocuments}
          onDocumentUpload={handleInitialDocumentUpload}
          onDocumentRemove={handleInitialDocumentRemove}
          proposalCode={proposalCode}
        />

        {/* Form I Editor */}
        <Suspense fallback={
          <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-black">Loading editor...</p>
              </div>
            </div>
          </div>
        }>
          <FormIEditor
            editorContent={formIContent}
            uploadedPdf={formIUploadedPdf}
            onContentChange={handleFormIContentChange}
            onPdfUpload={setFormIUploadedPdf}
            onPdfRemove={() => setFormIUploadedPdf(null)}
            onSave={handleFormISave}
            lastSavedTime={lastSavedTime}
            isAutoSaving={isAutoSaving}
            proposalCode={proposalCode}
          />
        </Suspense>

        {/* Additional Forms */}
        <AdditionalFormsUpload
          forms={additionalForms}
          onFormUpload={handleAdditionalFormUpload}
          onFormRemove={handleAdditionalFormRemove}
          proposalCode={proposalCode}
        />

        {/* Supporting Documents */}
        <SupportingDocumentsUpload
          documents={supportingDocuments}
          onDocumentUpload={handleSupportingDocumentUpload}
          onDocumentRemove={handleSupportingDocumentRemove}
          proposalCode={proposalCode}
        />

        {/* Submit Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSubmitClick}
            disabled={isSavingToBackend}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingToBackend ? 'Saving...' : 'Submit Proposal'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleFinalSubmission}
        proposalData={{
          proposalInfo,
          initialDocuments,
          additionalForms,
          supportingDocuments,
          formIContent,
        }}
      />

      {/* Success Modal */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        proposalId={submittedProposalId}
      />

      {/* Chatbot */}
      <Chatbot showSaarthi={showChatbot} setShowSaarthi={setShowChatbot} />
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
