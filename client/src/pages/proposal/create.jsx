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
import { Moon, Sun, MoonStar } from 'lucide-react';

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
  
  // Theme state
  const [theme, setTheme] = useState('light');
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply dark class to document for CSS variable support
  useEffect(() => {
    const isDarkMode = theme === 'dark' || theme === 'darkest';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'darkest' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  // Theme helper variables
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  
  // Theme-based classes
  const bgClass = isDarkest ? 'bg-black' : isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100';
  const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-black';
  const subTextColor = isDark ? 'text-slate-400' : 'text-black';
  const borderColor = isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-200';
  
  // Storage instance
  const storageRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);
  const formIEditorRef = useRef(null);

  // Proposal metadata
  const [proposalId, setProposalId] = useState(null);
  const [proposalCode, setProposalCode] = useState(null);
  const [proposalStatus, setProposalStatus] = useState('DRAFT');
  const [currentVersion, setCurrentVersion] = useState(0.1); // Drafts start at 0.1
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
  const [isNewProposal, setIsNewProposal] = useState(true); // Track if this is a new proposal vs continuing draft

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
        
        // Check for draft query parameter - only load draft if explicitly requested
        const draftId = router.query.draft;
        
        if (draftId) {
          // User clicked "Continue Draft" - load the specific draft
          // Initialize storage with the draft ID first
          storageRef.current.initialize(draftId);
          setIsNewProposal(false); // This is continuing an existing draft
          
          try {
            const fullDraft = await getProposalById(draftId);
            const draftData = fullDraft.data;
            
            // Update state
            setProposalId(draftData._id);
            setProposalCode(draftData.proposalCode);
            setProposalStatus(draftData.status || 'DRAFT');
            setCurrentVersion(draftData.currentVersion || 0.1); // Drafts are 0.1
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
            
            // Set form content - use formi field (single form storage)
            if (draftData.formi) {
              setFormIContent(draftData.formi);
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
              formIContent: draftData.formi, // Use formi field
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
              currentVersion: draftData.currentVersion || 0.1,
            }, false);
            
            info('Draft proposal loaded');
          } catch (err) {
            console.error('Failed to load draft:', err);
            error('Failed to load draft proposal');
            // Clear the draft param and start fresh
            router.replace('/proposal/create', undefined, { shallow: true });
          }
        } else {
          // No draft param - user clicked "New Proposal" - start fresh
          // Clear any existing localStorage data for new proposals
          storageRef.current.clear();
          storageRef.current.initialize('new');
          setIsNewProposal(true); // This is a new proposal
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        error('Failed to initialize proposal');
        setIsLoading(false);
      }
    };
    
    // Wait for router to be ready before initializing
    if (router.isReady) {
      initializeProposal();
    }
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [router.isReady, router.query.draft]);

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
    const handleBeforeUnload = (e) => {
      // Get latest content and try to save synchronously using sendBeacon
      // Note: async operations don't work reliably in beforeunload
      if (formIEditorRef.current) {
        try {
          const latestContent = formIEditorRef.current.getFormData();
          if (latestContent && proposalId) {
            // Use sendBeacon for reliable data sending on page close
            const token = localStorage.getItem('token');
            const payload = JSON.stringify({
              formi: latestContent, // Single form field
              title: proposalInfo.title,
              fundingMethod: proposalInfo.fundingMethod,
              principalAgency: proposalInfo.principalImplementingAgency,
              projectLeader: proposalInfo.projectLeader,
              projectCoordinator: proposalInfo.projectCoordinator,
              durationMonths: parseInt(proposalInfo.projectDurationMonths) || 0,
              outlayLakhs: parseFloat(proposalInfo.projectOutlayLakhs) || 0
            });
            
            // Create a Blob with proper content type for the beacon
            const blob = new Blob([payload], { type: 'application/json' });
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            navigator.sendBeacon(`${apiUrl}/api/proposals/${proposalId}/beacon-save?token=${token}`, blob);
            console.log('[SAVE] Sent beacon save on page close');
          }
        } catch (err) {
          console.error('Failed to save draft on page close:', err);
        }
      }
    };
    
    const handleRouteChange = async (url) => {
      // Skip if navigating to dashboard (handleBackToDashboard handles this)
      if (url.includes('/dashboard')) return;
      
      try {
        const latestContent = formIEditorRef.current?.getFormData();
        if (latestContent) {
          await saveToBackendWithContent(latestContent);
          console.log('[SAVE] Saved on route change');
        }
      } catch (err) {
        console.error('Failed to save draft on route change:', err);
        // Don't block navigation
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events?.on('routeChangeStart', handleRouteChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router, proposalId, proposalInfo]);

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
    return saveToBackendWithContent(formIContent);
  };
  
  // Save to backend with specific content (called from manual save and back to dashboard)
  const saveToBackendWithContent = async (formContent) => {
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
      
      // Use the provided formContent (latest from editor) or fall back to state
      const editorContentToSave = formContent || formIContent;
      console.log('[SAVE] saveToBackendWithContent - editorContentToSave:', editorContentToSave);
      
      const proposalData = {
        title: proposalInfo.title,
        fundingMethod: normalizeFundingMethod(proposalInfo.fundingMethod),
        principalAgency: proposalInfo.principalImplementingAgency,
        subAgencies: proposalInfo.subImplementingAgency ? [proposalInfo.subImplementingAgency] : [],
        projectLeader: proposalInfo.projectLeader,
        projectCoordinator: proposalInfo.projectCoordinator,
        durationMonths: parseInt(proposalInfo.projectDurationMonths) || 0,
        outlayLakhs: parseFloat(proposalInfo.projectOutlayLakhs) || 0,
        formi: editorContentToSave, // Single form field
        supportingDocs
      };
      
      // Debug log to verify correct values
      console.log('Sending proposal data to backend:', {
        fundingMethod: proposalData.fundingMethod,
        title: proposalData.title,
        hasFormI: !!proposalData.formi
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
    console.log('[EDITOR] handleFormIContentChange called with:', data);
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

  // Handle Form I manual save (called from AdvancedProposalEditor's handleManualSave)
  const handleFormIManualSave = async (formDataStore) => {
    console.log('[SAVE] handleFormIManualSave called with formDataStore:', formDataStore);
    
    try {
      // Update formIContent state with the latest editor content
      if (formDataStore) {
        setFormIContent(formDataStore);
      }
      
      // Mark as dirty and save to localStorage
      hasUnsavedChangesRef.current = true;
      storageRef.current?.markDirty();
      handleAutoSave();
      
      // Also save to backend immediately
      await saveToBackendWithContent(formDataStore);
      
      success('Form I saved successfully');
    } catch (err) {
      console.error('Manual save error:', err);
      error('Failed to save Form I');
    }
  };
  
  // Handle Form I auto save (called from AdvancedProposalEditor's auto-save)
  const handleFormIAutoSave = async (formDataStore) => {
    console.log('[SAVE] handleFormIAutoSave called with formDataStore:', formDataStore);
    
    try {
      // Update formIContent state with the latest editor content
      if (formDataStore) {
        setFormIContent(formDataStore);
      }
      
      // Mark as dirty and save to localStorage
      hasUnsavedChangesRef.current = true;
      storageRef.current?.markDirty();
      handleAutoSave();
    } catch (err) {
      console.error('Auto save error:', err);
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

  // Helper function to get the latest editor content
  const getLatestEditorContent = () => {
    if (formIEditorRef.current) {
      const editorData = formIEditorRef.current.getFormData();
      if (editorData) {
        console.log('[SAVE] Got latest content from editor ref');
        return editorData;
      }
    }
    console.log('[SAVE] Using formIContent state');
    return formIContent;
  };

  // Handle back to dashboard
  const handleBackToDashboard = async () => {
    // Try to save to backend before navigating, but don't block if it fails
    try {
      // Always get the latest editor content before saving
      const latestContent = getLatestEditorContent();
      console.log('[SAVE] handleBackToDashboard - saving with content:', latestContent ? 'has content' : 'no content');
      
      if (latestContent) {
        await saveToBackendWithContent(latestContent);
      }
    } catch (err) {
      console.error('Failed to save draft before leaving:', err);
      // Don't block navigation - user may have an empty/incomplete draft
    }
    router.push('/dashboard');
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
      // Always get the latest editor content before saving
      const latestContent = getLatestEditorContent();
      console.log('[SUBMIT] Saving with latest editor content:', latestContent ? 'has content' : 'no content');
      
      // Save to backend with latest content
      await saveToBackendWithContent(latestContent);
      
      // Wait a moment for save to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      <div className={`min-h-screen ${bgClass} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`${textColor} text-lg`}>Loading proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header with back button */}
      <div className={`${cardBg} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${isDark ? `border-slate-600 ${textColor} hover:bg-white/5` : `border-slate-300 ${textColor} hover:bg-black/5`}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            {proposalCode && (
              <div className={`flex items-center gap-3 text-sm ${textColor}`}>
                <span>Code: <span className="font-mono font-semibold">{proposalCode}</span></span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-200 border border-slate-300'}`}>
                  {proposalStatus === 'DRAFT' ? 'Draft v0.1' : `v${currentVersion}`}
                </span>
              </div>
            )}
          </div>
          
          {/* Right side: Last saved, Date, Theme toggle */}
          <div className="flex items-center gap-4">
            {lastSavedTime && (
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-black'}`}>
                {isAutoSaving ? (
                  <span className="flex items-center gap-2">
                    <div className={`w-3 h-3 border-2 ${isDark ? 'border-white/30 border-t-white' : 'border-black/20 border-t-black'} rounded-full animate-spin`}></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className={`w-4 h-4 ${textColor}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Last saved: {lastSavedTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-black'}`}>
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}
              title={theme === 'light' ? 'Switch to Dark Mode' : theme === 'dark' ? 'Switch to Darkest Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : theme === 'dark' ? (
                <MoonStar className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Guidelines */}
        <Guidelines theme={theme} />

        {/* Pre-submission info */}
        <PreSubmissionInfo theme={theme} />

        {/* Proposal Information */}
        <ProposalInformation
          proposalInfo={proposalInfo}
          validationErrors={validationErrors}
          onChange={handleInfoChange}
          theme={theme}
        />

        {/* Initial Documents */}
        <InitialDocumentsUpload
          documents={initialDocuments}
          onDocumentUpload={handleInitialDocumentUpload}
          onDocumentRemove={handleInitialDocumentRemove}
          proposalCode={proposalCode}
          theme={theme}
        />

        {/* Form I Editor */}
        <Suspense fallback={
          <div className={`${cardBg} border rounded-xl p-6 mb-6`}>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`w-12 h-12 border-4 ${isDark ? 'border-white/20 border-t-white' : 'border-black/10 border-t-black'} rounded-full animate-spin mx-auto mb-4`}></div>
                <p className={textColor}>Loading editor...</p>
              </div>
            </div>
          </div>
        }>
          <FormIEditor
            ref={formIEditorRef}
            editorContent={formIContent}
            uploadedPdf={formIUploadedPdf}
            onContentChange={handleFormIContentChange}
            onPdfUpload={setFormIUploadedPdf}
            onPdfRemove={() => setFormIUploadedPdf(null)}
            onManualSave={handleFormIManualSave}
            onAutoSave={handleFormIAutoSave}
            lastSavedTime={lastSavedTime}
            isAutoSaving={isAutoSaving}
            proposalCode={proposalCode}
            isNewProposal={isNewProposal}
            theme={theme}
          />
        </Suspense>

        {/* Additional Forms */}
        <AdditionalFormsUpload
          forms={additionalForms}
          onFormUpload={handleAdditionalFormUpload}
          onFormRemove={handleAdditionalFormRemove}
          proposalCode={proposalCode}
          theme={theme}
        />

        {/* Supporting Documents */}
        <SupportingDocumentsUpload
          documents={supportingDocuments}
          onDocumentUpload={handleSupportingDocumentUpload}
          onDocumentRemove={handleSupportingDocumentRemove}
          proposalCode={proposalCode}
          theme={theme}
        />

        {/* Submit Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSubmitClick}
            disabled={isSavingToBackend}
            className={`px-8 py-3 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'}`}
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
        theme={theme}
      />

      {/* Success Modal */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        proposalId={submittedProposalId}
        theme={theme}
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
