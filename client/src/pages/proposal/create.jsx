'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Chatbot from '../../components/Saarthi';
import { useToast, ToastContainer } from '../../components/ui (plate files)/toast';

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

  // Initial Documents State (covering letter and CV)
  const [initialDocuments, setInitialDocuments] = useState({
    coveringLetter: null,
    cv: null,
  });

  // Form I Editor Content
  const [formIContent, setFormIContent] = useState(null);

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

  // Modal States
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedProposalId, setSubmittedProposalId] = useState('');

  // Chatbot State
  const [showChatbot, setShowChatbot] = useState(false);

  // Validate proposal info
  useEffect(() => {
    validateProposalInfo();
  }, [proposalInfo]);

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

  // Handle proposal info change
  const handleInfoChange = (field, value) => {
    setProposalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle initial document upload
  const handleInitialDocumentUpload = (docType, docData) => {
    setInitialDocuments((prev) => ({
      ...prev,
      [docType]: docData,
    }));
    success(`${docType === 'coveringLetter' ? 'Covering Letter' : 'CV'} uploaded successfully`);
  };

  // Handle initial document remove
  const handleInitialDocumentRemove = (docType) => {
    setInitialDocuments((prev) => ({
      ...prev,
      [docType]: null,
    }));
    info(`${docType === 'coveringLetter' ? 'Covering Letter' : 'CV'} removed`);
  };

  // Handle Form I content change
  const handleFormIContentChange = (data) => {
    setFormIContent(data);
  };

  // Handle Form I save (both auto and manual)
  const handleFormISave = async (data, isAutoSave = false) => {
    if (isAutoSave) {
      setIsAutoSaving(true);
    }

    try {
      // Mock API call to save Form I
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSavedTime(new Date());
      
      if (!isAutoSave) {
        success('Form I saved successfully');
      }
    } catch (err) {
      console.error('Save error:', err);
      if (!isAutoSave) {
        error('Failed to save Form I');
      }
    } finally {
      if (isAutoSave) {
        setIsAutoSaving(false);
      }
    }
  };

  // Handle additional form upload
  const handleAdditionalFormUpload = (formId, formData) => {
    setAdditionalForms((prev) => ({
      ...prev,
      [formId]: formData,
    }));
    success(`${formId.toUpperCase()} uploaded successfully`);
  };

  // Handle additional form remove
  const handleAdditionalFormRemove = (formId) => {
    setAdditionalForms((prev) => ({
      ...prev,
      [formId]: null,
    }));
    info(`${formId.toUpperCase()} removed`);
  };

  // Handle supporting document upload
  const handleSupportingDocumentUpload = (docId, docData) => {
    setSupportingDocuments((prev) => ({
      ...prev,
      [docId]: docData,
    }));
    success('Supporting document uploaded successfully');
  };

  // Handle supporting document remove
  const handleSupportingDocumentRemove = (docId) => {
    setSupportingDocuments((prev) => ({
      ...prev,
      [docId]: null,
    }));
    info('Supporting document removed');
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
      // Create formatted error message with line breaks
      const errorMessage = errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
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
      // Mock API call to submit proposal
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock proposal ID
      const mockProposalId = `PROP-${Date.now()}`;
      setSubmittedProposalId(mockProposalId);

      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission error:', err);
      error('Failed to submit proposal. Please try again.');
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black/5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Guidelines */}
        <Guidelines />

        {/* Pre-submission Information */}
        <PreSubmissionInfo />

        {/* Proposal Information */}
        <ProposalInformation
          proposalInfo={proposalInfo}
          validationErrors={validationErrors}
          onChange={handleInfoChange}
        />

        {/* Initial Documents Upload */}
        <InitialDocumentsUpload
          documents={initialDocuments}
          onDocumentUpload={handleInitialDocumentUpload}
          onDocumentRemove={handleInitialDocumentRemove}
        />

        {/* Form I Editor with Lazy Loading */}
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
            onContentChange={handleFormIContentChange}
            onSave={handleFormISave}
            lastSavedTime={lastSavedTime}
            isAutoSaving={isAutoSaving}
          />
        </Suspense>

        {/* Additional Forms Upload */}
        <AdditionalFormsUpload
          forms={additionalForms}
          onFormUpload={handleAdditionalFormUpload}
          onFormRemove={handleAdditionalFormRemove}
        />

        {/* Supporting Documents Upload */}
        <SupportingDocumentsUpload
          documents={supportingDocuments}
          onDocumentUpload={handleSupportingDocumentUpload}
          onDocumentRemove={handleSupportingDocumentRemove}
        />

        {/* Submit Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSubmitClick}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-semibold text-lg"
          >
            Submit Proposal
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

      {/* Submission Success Modal */}
      <SubmissionSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        proposalId={submittedProposalId}
      />

      {/* Saarthi Chatbot */}
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
