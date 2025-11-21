'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { TAB_CONFIGS, TAB_DEFAULT_CONTENT } from '@/components/proposal-tabs';
import { useToast, ToastContainer } from '@/components/ui/toast';

/**
 * AdvancedProposalEditor using Plate.js
 * A modern replacement for the TipTap-based editor with enhanced features
 */
const AdvancedProposalEditor = ({ 
  initialContent = null, 
  onContentChange = () => {}, 
  onWordCountChange = () => {},
  onCharacterCountChange = () => {},
  proposalTitle = 'Research Proposal',
  showStats = true,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(TAB_CONFIGS[0].id);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toasts, removeToast, success, info } = useToast();

  // Tab-specific editor content state
  const [tabEditorValues, setTabEditorValues] = useState(() => {
    const initialValues = {};
    TAB_CONFIGS.forEach(tab => {
      initialValues[tab.id] = normalizeNodeId(TAB_DEFAULT_CONTENT[tab.id] || [
        { type: 'p', children: [{ text: '' }] }
      ]);
    });
    return initialValues;
  });

  // Get current tab's content - memoized to prevent unnecessary recalculations
  const currentTabContent = useMemo(() => {
    return tabEditorValues[activeTab];
  }, [activeTab, tabEditorValues]);

  // Extract plain text from Plate.js value - memoized for performance
  const extractPlainText = useCallback((nodes) => {
    if (!nodes || !Array.isArray(nodes)) return '';
    
    return nodes.map(node => {
      if (node.text !== undefined) return node.text;
      if (node.children) return extractPlainText(node.children);
      return '';
    }).join('');
  }, []);

  // Create editor instance for active tab - recreate when tab changes
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: currentTabContent,
  }, [activeTab]); // Recreate editor when activeTab changes

  // Save editor content when switching tabs or for external access
  const saveCurrentTabContent = useCallback(() => {
    if (editor) {
      const currentValue = editor.children;
      setTabEditorValues(prev => ({
        ...prev,
        [activeTab]: currentValue,
      }));
      onContentChange(currentValue);
    }
  }, [editor, activeTab, onContentChange]);

  // Save content when switching tabs
  useEffect(() => {
    return () => {
      saveCurrentTabContent();
    };
  }, [activeTab, saveCurrentTabContent]);

  // Auto-save with long polling (every 2 seconds) + real-time word/character count
  useEffect(() => {
    if (!editor) return;

    const autoSaveAndUpdateStats = async () => {
      const currentValue = editor.children;
      const savedValue = tabEditorValues[activeTab];
      
      // Update word/character count in real-time
      const text = extractPlainText(currentValue);
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const chars = text.length;
      
      setWordCount(words);
      setCharacterCount(chars);
      onWordCountChange(words);
      onCharacterCountChange(chars);
      
      // Check if content changed and auto-save
      const hasChanges = JSON.stringify(currentValue) !== JSON.stringify(savedValue);
      
      if (hasChanges) {
        setIsAutoSaving(true);
        
        // Update saved state
        setTabEditorValues(prev => ({
          ...prev,
          [activeTab]: currentValue,
        }));
        
        onContentChange(currentValue);
        setLastSavedTime(new Date());
        
        // Brief delay to show auto-save indicator
        await new Promise(resolve => setTimeout(resolve, 200));
        setIsAutoSaving(false);
      }
    };

    const interval = setInterval(autoSaveAndUpdateStats, 2000);
    return () => clearInterval(interval);
  }, [editor, activeTab, tabEditorValues, extractPlainText, onWordCountChange, onCharacterCountChange, onContentChange]);

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!editor || isSaving) return;

    const currentValue = editor.children;
    const savedValue = tabEditorValues[activeTab];
    
    // Check if already saved
    const hasChanges = JSON.stringify(currentValue) !== JSON.stringify(savedValue);
    
    if (!hasChanges) {
      info('All changes saved', 2000);
      return;
    }

    setIsSaving(true);
    
    try {
      // Update saved state
      setTabEditorValues(prev => ({
        ...prev,
        [activeTab]: currentValue,
      }));

      // Calculate word and character count
      const text = extractPlainText(currentValue);
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const chars = text.length;

      setWordCount(words);
      setCharacterCount(chars);
      onWordCountChange(words);
      onCharacterCountChange(chars);
      onContentChange(currentValue);

      // Update save time
      setLastSavedTime(new Date());

      // Show success toast
      success('Saved successfully', 2000);

      // Simulate save delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsSaving(false);
    }
  }, [editor, activeTab, tabEditorValues, extractPlainText, onWordCountChange, onCharacterCountChange, onContentChange, isSaving, success, info]);

  // Export to PDF function with loading animation
  const handleExportPDF = useCallback(async () => {
    if (isExporting || !editor) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      // Import required libraries
      const { default: html2canvas } = await import('html2canvas-pro');
      const PDFLib = await import('pdf-lib');
      
      setExportProgress(30);

      // Create canvas from editor
      const style = document.createElement('style');
      document.head.append(style);

      const canvas = await html2canvas(editor.api.toDOMNode(editor), {
        onclone: (document) => {
          const editorElement = document.querySelector('[contenteditable="true"]');
          if (editorElement) {
            Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
              const existingStyle = element.getAttribute('style') || '';
              element.setAttribute(
                'style',
                `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
              );
            });
          }
        },
      });
      
      style.remove();
      setExportProgress(60);

      // Create PDF
      const pdfDoc = await PDFLib.PDFDocument.create();
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      const imageEmbed = await pdfDoc.embedPng(canvas.toDataURL('PNG'));
      const { height, width } = imageEmbed.scale(1);
      
      page.drawImage(imageEmbed, {
        height,
        width,
        x: 0,
        y: 0,
      });
      
      setExportProgress(80);
      
      const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });
      
      setExportProgress(90);

      // Download file
      const response = await fetch(pdfBase64);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${proposalTitle.replace(/\s+/g, '_')}_proposal.pdf`;
      document.body.append(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Show success message
      setTimeout(() => {
        success('PDF exported successfully!', 2000);
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Error exporting PDF. Please try again.');
    }
  }, [editor, proposalTitle, isExporting, success]);

  return (

    <div className={`bg-white rounded-xl shadow-xl p-6 border border-orange-200 ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-4 h-4 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          Advanced Proposal Editor
        </h2>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TAB_CONFIGS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-white text-black border border-gray-200 hover:bg-orange-50'
              }`}
              title={tab.description}
            >
              {tab.label}
            </button>
          ))}
        </div>



        {/* Plate.js Editor */}
        <div className="border border-gray-200 rounded-xl min-h-[600px] bg-white shadow-inner">
          <Plate 
            key={activeTab}
            editor={editor}
          >
            <FixedToolbar>
              <FixedToolbarButtons />
            </FixedToolbar>
            
            <EditorContainer className="pt-4 pb-2">
              <Editor 
                variant="default"
                className="min-h-[500px] focus:outline-none text-black leading-relaxed pb-4 px-4"
              />
            </EditorContainer>
          </Plate>
        </div>

        {/* Save Button and Status */}
        <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700 shadow'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Now
                </>
              )}
            </button>
            
            {isAutoSaving ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="font-medium">Auto-saving...</span>
              </div>
            ) : lastSavedTime ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Last saved: {lastSavedTime.toLocaleTimeString()}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Auto-save enabled
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {showStats && (
              <div className="flex gap-6 text-sm text-black">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <strong>{wordCount} words</strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <strong>{characterCount} characters</strong>
                </div>
              </div>
            )}
            
            {/* Prominent Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 shadow-lg ${
                isExporting
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 hover:scale-105 hover:shadow-xl'
              }`}
              title="Export proposal as PDF"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                    <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                  </svg>
                  Export as PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Export Loading Modal */}
        {isExporting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn">
              <div className="text-center">
                {/* Animated Icon */}
                <div className="mb-6 relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
                    </svg>
                  </div>
                  {/* Spinning Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Generating PDF
                </h3>
                <p className="text-slate-600 mb-6">
                  Please wait while we convert your proposal...
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-orange-600 mb-2 font-semibold">
                    <span>Export Progress</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                      style={{ width: `${exportProgress}%` }}
                    >
                      {/* Animated Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Loading Dots Animation */}
                <div className="flex justify-center space-x-2 mt-6">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg"></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {showStats && (
          <div className="mt-8 space-y-6">
            
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-black mb-2 flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Essential Sections for Coal R&D Proposals
              </h4>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-black">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Title & Abstract
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Funding Method & Scheme
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Principal Implementing Agency
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Sub-Implementing Agency
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Project Leader & Coordinator
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Problem Statement & Research Gap
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Research Objectives & Expected Outcomes
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Research Methodology & Work Plan
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Project Duration & Milestones
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Project Outlay (Rs. in Lakhs) & Budget Breakdown
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Team, Facilities & Collaborations
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Technical Specifications & Data Management
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Risk Assessment & Mitigation
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Dissemination & Impact Plan
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedProposalEditor;
