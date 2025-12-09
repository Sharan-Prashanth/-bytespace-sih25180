'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Download, FileText, Send, Pen, Image as ImageIcon, Upload, Trash2, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../utils/api';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import SignatureCanvas from 'react-signature-canvas';

export default function ClarificationReportEditor({ 
  proposalId,
  proposalCode,
  committeeType,
  onClose,
  onSubmit,
  theme = 'light'
}) {
  const [reportId, setReportId] = useState(null);
  const [title, setTitle] = useState('Clarification Request Report');
  const [content, setContent] = useState('');
  
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [sealPreview, setSealPreview] = useState(null);
  const [sealFile, setSealFile] = useState(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success', 'error', 'info'
  const [modalMessage, setModalMessage] = useState('');
  
  const signatureCanvasRef = useRef(null);
  const signatureInputRef = useRef(null);
  const sealInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const notificationModalRef = useRef(null);

  const isDark = theme === 'dark' || theme === 'darkest';
  const bgClass = isDark ? 'bg-black' : 'bg-white';
  const textClass = 'text-black';
  const borderClass = isDark ? 'border-white/10' : 'border-black/10';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';

  // Show modal function
  const showNotification = (message, type = 'info') => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // Click outside to close main modal (disabled - only X button should close)
  // This prevents accidental closure when clicking notification modals
  useEffect(() => {
    // Disabled click-outside functionality
    // Only the X button should close the main modal
  }, [onClose]);

  // Prevent Enter key from closing modals when notification is shown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && showModal) {
        event.preventDefault();
        event.stopPropagation();
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  const saveDraft = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const reportData = {
        title,
        content,
        signature: signatureDataUrl,
      };

      let currentReportId = reportId;

      if (reportId) {
        await apiClient.put(`/api/clarification-reports/${reportId}`, reportData);
      } else {
        const response = await apiClient.post(
          `/api/proposals/${proposalId}/clarification-reports`,
          reportData
        );
        currentReportId = response.data.data._id;
        setReportId(currentReportId);
      }

      // Upload seal if provided
      if (sealFile && currentReportId) {
        const formData = new FormData();
        formData.append('seal', sealFile);
        
        await apiClient.post(
          `/api/clarification-reports/${currentReportId}/upload-seal`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      showNotification('Draft saved successfully!', 'success');
      return currentReportId;
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft: ' + (error.response?.data?.message || error.message), 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [reportId, proposalId, title, content, signatureDataUrl, sealFile]);

  const saveSignatureFromPad = useCallback(() => {
    if (!signatureCanvasRef.current) {
      showNotification('Signature pad not ready. Please try again.', 'error');
      return;
    }

    try {
      const sigCanvas = signatureCanvasRef.current;
      
      // Check if isEmpty method exists and use it
      if (typeof sigCanvas.isEmpty === 'function' && sigCanvas.isEmpty()) {
        showNotification('Please draw your signature first', 'info');
        return;
      }

      // Get the data URL
      if (typeof sigCanvas.toDataURL === 'function') {
        const dataUrl = sigCanvas.toDataURL('image/png');
        
        // Additional check for empty canvas
        if (dataUrl.length < 200) {
          showNotification('Please draw your signature first', 'info');
          return;
        }
        
        setSignatureDataUrl(dataUrl);
        setShowSignaturePad(false);
        showNotification('Signature saved successfully!', 'success');
      } else {
        showNotification('Signature pad not ready. Please use the upload option.', 'error');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      showNotification('Failed to save signature. Please try uploading an image instead.', 'error');
    }
  }, []);

  const clearSignaturePad = useCallback(() => {
    if (!signatureCanvasRef.current) return;

    try {
      const sigCanvas = signatureCanvasRef.current;
      if (typeof sigCanvas.clear === 'function') {
        sigCanvas.clear();
      }
    } catch (error) {
      console.error('Error clearing signature:', error);
    }
  }, []);

  const handleSignatureUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureDataUrl(event.target.result);
      showNotification('Signature uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }, []);

  const removeSignature = useCallback(() => {
    setSignatureDataUrl(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  }, []);

  const handleSealUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    setSealFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSealPreview(event.target.result);
      showNotification('Seal uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }, []);

  const removeSeal = useCallback(() => {
    setSealPreview(null);
    setSealFile(null);
    if (sealInputRef.current) {
      sealInputRef.current.value = '';
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      showNotification('Please enter title and content before exporting', 'error');
      return;
    }

    try {
      setIsExporting(true);
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, margin, y);
      y += 12;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Committee: ${committeeType}`, margin, y);
      y += 7;
      pdf.text(`Proposal Code: ${proposalCode}`, margin, y);
      y += 7;
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
      y += 15;

      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
      
      for (const line of lines) {
        if (y + 10 > pageHeight - 80) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 7;
      }

      // Add signature and seal at bottom right
      if (signatureDataUrl || sealPreview) {
        const lastPage = pdf.internal.pages.length - 1;
        pdf.setPage(lastPage);
        
        const bottomY = pageHeight - 60;
        const rightX = pageWidth - margin;

        if (signatureDataUrl) {
          const sigWidth = 60;
          const sigHeight = 25;
          pdf.addImage(signatureDataUrl, 'PNG', rightX - sigWidth, bottomY, sigWidth, sigHeight);
          pdf.setFontSize(8);
          pdf.text('Signature', rightX - sigWidth + 15, bottomY + sigHeight + 5);
        }

        if (sealPreview) {
          const sealSize = 40;
          const sealX = signatureDataUrl ? rightX - 70 - sealSize : rightX - sealSize;
          pdf.addImage(sealPreview, 'PNG', sealX, bottomY, sealSize, sealSize);
          pdf.setFontSize(8);
          pdf.text('Seal', sealX + 12, bottomY + sealSize + 5);
        }
      }

      pdf.save(`${committeeType}_Clarification_${proposalCode}.pdf`);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showNotification('Failed to export PDF: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [title, content, committeeType, proposalCode, signatureDataUrl, sealPreview]);

  const exportToDocx = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      showNotification('Please enter title and content before exporting', 'error');
      return;
    }

    try {
      setIsExporting(true);

      const children = [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32 })],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Committee: ${committeeType}`, size: 20 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Proposal Code: ${proposalCode}`, size: 20 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, size: 20 })],
          spacing: { after: 200 }
        }),
      ];

      const contentLines = content.split('\n');
      contentLines.forEach(line => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line || ' ', size: 22 })],
            spacing: { after: 100 }
          })
        );
      });

      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 22 })],
          spacing: { after: 400 }
        })
      );

      const signatureSealChildren = [];
      
      if (sealPreview) {
        const sealBase64 = sealPreview.split(',')[1];
        signatureSealChildren.push(
          new ImageRun({
            data: Buffer.from(sealBase64, 'base64'),
            transformation: { width: 80, height: 80 }
          })
        );
        signatureSealChildren.push(new TextRun({ text: '    ', size: 20 }));
      }

      if (signatureDataUrl) {
        const signatureBase64 = signatureDataUrl.split(',')[1];
        signatureSealChildren.push(
          new ImageRun({
            data: Buffer.from(signatureBase64, 'base64'),
            transformation: { width: 120, height: 50 }
          })
        );
      }

      if (signatureSealChildren.length > 0) {
        children.push(
          new Paragraph({
            children: signatureSealChildren,
            alignment: AlignmentType.RIGHT
          })
        );
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${committeeType}_Clarification_${proposalCode}.docx`);
      showNotification('DOCX downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      showNotification('Failed to export DOCX: ' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [title, content, committeeType, proposalCode, signatureDataUrl, sealPreview]);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let currentReportId = reportId;

    try {
      setIsSubmitting(true);
      
      // Save draft first if not saved
      if (!currentReportId) {
        currentReportId = await saveDraft();
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.post(
        `/api/clarification-reports/${currentReportId}/upload-scanned`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      showNotification('Scanned document uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('Failed to upload file: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [reportId, saveDraft]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      showNotification('Please enter a report title', 'error');
      return;
    }
    
    if (!content.trim()) {
      showNotification('Please enter report content', 'error');
      return;
    }

    if (!signatureDataUrl) {
      showNotification('Please provide your signature', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      let currentReportId = reportId;

      // Save draft first if not exists
      if (!reportId) {
        const reportData = {
          title,
          content,
          signature: signatureDataUrl,
        };
        
        const response = await apiClient.post(
          `/api/proposals/${proposalId}/clarification-reports`,
          reportData
        );
        currentReportId = response.data.data._id;
        setReportId(currentReportId);
      }

      // Upload seal if provided
      if (sealFile && currentReportId) {
        const formData = new FormData();
        formData.append('seal', sealFile);
        
        await apiClient.post(
          `/api/clarification-reports/${currentReportId}/upload-seal`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      // Submit the report
      const reportData = {
        title,
        content,
        signature: signatureDataUrl,
        status: 'SUBMITTED'
      };

      await apiClient.put(
        `/api/clarification-reports/${currentReportId}`,
        reportData
      );

      showNotification('Clarification report submitted successfully! Email sent to user.', 'success');
      
      setTimeout(() => {
        if (onSubmit) {
          onSubmit();
        }
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      showNotification('Failed to submit report: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [reportId, proposalId, title, content, signatureDataUrl, sealFile, onSubmit, onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div ref={modalRef} className={`${bgClass} rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
          <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
            <div>
              <h2 className={`text-2xl font-bold ${textClass}`}>Clarification Report</h2>
              <p className={`text-sm ${textClass} mt-1`}>
                {committeeType} • {proposalCode}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 ${hoverClass} rounded-lg transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${bgClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-black`}
                    placeholder="Enter report title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${textClass} mb-2`}>
                    Report Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${bgClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-black min-h-[400px] resize-y font-mono`}
                    placeholder="Enter your clarification requests, corrections, or suggestions..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className={`border ${borderClass} rounded-lg p-4`}>
                  <h3 className={`text-sm font-bold ${textClass} mb-3`}>Signature *</h3>
                  
                  {!signatureDataUrl ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowSignaturePad(!showSignaturePad)}
                        className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2`}
                      >
                        <Pen className="w-4 h-4" />
                        <span className={textClass}>Draw Signature</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2`}
                      >
                        <Upload className="w-4 h-4" />
                        <span className={textClass}>Upload Signature</span>
                      </button>
                      
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />

                      {showSignaturePad && (
                        <div className="space-y-3">
                          <div className={`border ${borderClass} rounded-lg overflow-hidden bg-white`}>
                            <SignatureCanvas
                              ref={signatureCanvasRef}
                              canvasProps={{
                                width: 280,
                                height: 150,
                                className: 'signature-canvas'
                              }}
                              backgroundColor="white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={clearSignaturePad}
                              className={`flex-1 px-3 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors ${textClass} text-sm`}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={saveSignatureFromPad}
                              className="flex-1 px-3 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`border ${borderClass} rounded-lg p-3 bg-white flex justify-end`}>
                        <img src={signatureDataUrl} alt="Signature" className="h-16 object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={removeSignature}
                        className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2 ${textClass} text-sm`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className={`border ${borderClass} rounded-lg p-4`}>
                  <h3 className={`text-sm font-bold ${textClass} mb-3`}>Seal (Optional)</h3>
                  
                  {!sealPreview ? (
                    <button
                      type="button"
                      onClick={() => sealInputRef.current?.click()}
                      className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className={textClass}>Upload Seal</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className={`border ${borderClass} rounded-lg p-3 bg-white flex justify-end`}>
                        <img src={sealPreview} alt="Seal" className="h-20 object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={removeSeal}
                        className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2 ${textClass} text-sm`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                  
                  <input
                    ref={sealInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSealUpload}
                    className="hidden"
                  />
                </div>

                <div className={`border ${borderClass} rounded-lg p-4`}>
                  <h3 className={`text-sm font-bold ${textClass} mb-3`}>Upload Scanned Copy</h3>
                  <p className={`text-xs ${textClass} mb-3`}>
                    Upload a manually signed PDF or image
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!reportId) {
                        try {
                          await saveDraft();
                        } catch (error) {
                          return;
                        }
                      }
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 300);
                    }}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
                  >
                    <Upload className="w-4 h-4" />
                    <span className={textClass}>Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 border-t ${borderClass} flex items-center justify-between gap-4`}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-4 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center gap-2 ${textClass}`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              
              <button
                type="button"
                onClick={exportToPDF}
                disabled={isExporting}
                className={`px-4 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center gap-2 ${textClass} disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              
              <button
                type="button"
                onClick={exportToDocx}
                disabled={isExporting}
                className={`px-4 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors flex items-center gap-2 ${textClass} disabled:opacity-50`}
              >
                <FileText className="w-4 h-4" />
                DOCX
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaving}
                className={`px-6 py-2 border ${borderClass} rounded-lg ${hoverClass} transition-colors ${textClass} disabled:opacity-50`}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className={`${bgClass} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
              <h3 className={`text-xl font-bold ${textClass}`}>Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`p-2 ${hoverClass} rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-black mb-4">{title}</h1>
                
                <div className="text-sm text-black space-y-1 mb-6">
                  <p>Committee: {committeeType}</p>
                  <p>Proposal Code: {proposalCode}</p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="text-black whitespace-pre-wrap mb-20">
                  {content}
                </div>
                
                {(signatureDataUrl || sealPreview) && (
                  <div className="flex justify-end items-end gap-8 mt-8">
                    {sealPreview && (
                      <div className="text-center">
                        <img src={sealPreview} alt="Seal" className="h-24 w-24 object-contain" />
                        <p className="text-xs text-black mt-2">Seal</p>
                      </div>
                    )}
                    {signatureDataUrl && (
                      <div className="text-center">
                        <img src={signatureDataUrl} alt="Signature" className="h-16 object-contain" />
                        <p className="text-xs text-black mt-2">Signature</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showModal && (
        <div 
          ref={notificationModalRef}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(false);
            }
          }}
        >
          <div className={`${bgClass} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <div className="flex items-start gap-4">
              {modalType === 'success' && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />}
              {modalType === 'error' && <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />}
              {modalType === 'info' && <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />}
              
              <div className="flex-1">
                <p className={`${textClass} text-sm`}>{modalMessage}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
