import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Link } from '@tiptap/extension-link';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Blockquote } from '@tiptap/extension-blockquote';
import { History } from '@tiptap/extension-history';
import { HardBreak } from '@tiptap/extension-hard-break';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const AdvancedProposalEditor = ({ 
  initialContent = '', 
  onContentChange = () => {}, 
  onWordCountChange = () => {},
  onCharacterCountChange = () => {},
  proposalTitle = 'Research Proposal',
  showStats = true,
  showExportButtons = true,
  className = '',
  proposalId = null,
  autoSaveDraft = true,
  autoSaveDelay = 3000,
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const saveTimerRef = useRef(null);

  const saveDraftToServer = async (content) => {
    if (!content || !proposalId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/versions/saveDraft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ proposalId, content, title: proposalTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Draft saved on server:', data);
      } else if (res.status === 409) {
        console.warn('Duplicate draft detected (409).');
      } else if (res.status === 403) {
        console.warn('Plagiarism flagged (403).');
      } else {
        const text = await res.text();
        console.warn('Failed to save draft:', res.status, text);
      }
    } catch (err) {
      console.error('Error saving draft to server:', err);
    }
  };

  const scheduleSave = (content) => {
    if (!autoSaveDraft || !proposalId) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveDraftToServer(content);
      saveTimerRef.current = null;
    }, autoSaveDelay);
  };

  // Rich text editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      // Basic formatting
      Underline,
      Strike,
      Subscript,
      Superscript,
      // Text alignment
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      // Block elements
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-orange-500 pl-4 italic text-gray-700 bg-orange-50 py-2',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm',
        },
      }),
      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      // Media
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
        },
      }),
      // Code
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600',
        },
      }),
      // Utilities
      CharacterCount,
      HardBreak,
    ],
    content: initialContent || `
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">1. Problem Statement & Research Gap</h2>
      <p style="color: #374151; line-height: 1.6;">Coal remains a critical energy source for India, contributing approximately 44% of the country's energy mix. However, traditional coal utilization methods face significant challenges including low efficiency, high emissions, and environmental concerns. This proposal addresses the urgent need for advanced coal gasification technologies that can enhance energy conversion efficiency while minimizing environmental impact...</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">2. Research Objectives</h2>
      <p style="color: #374151; line-height: 1.6;"> <strong>Primary Objectives:</strong></p>
      <ul style="color: #374151; margin-left: 20px;">
        <li>Develop advanced coal gasification technology with 85%+ efficiency</li>
        <li>Reduce CO₂ emissions by 40% compared to conventional methods</li>
        <li>Create integrated carbon capture and utilization systems</li>
      </ul>
      `,
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setWordCount(words);
        setCharacterCount(characters);
        onWordCountChange(words);
        onCharacterCountChange(characters);
      }
      // Call parent content change handler
      const html = editor.getHTML();
      onContentChange(html);
      // Schedule auto-save of draft
      scheduleSave(html);
    },
  });

  // Update counts when editor is ready
  useEffect(() => {
    if (editor && editor.storage.characterCount) {
      const words = editor.storage.characterCount.words();
      const characters = editor.storage.characterCount.characters();
      setWordCount(words);
      setCharacterCount(characters);
      onWordCountChange(words);
      onCharacterCountChange(characters);
    }
  }, [editor, onWordCountChange, onCharacterCountChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Editor Utility Functions
  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const addTableRow = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  const deleteTableRow = () => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
    }
  };

  const addTableColumn = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const deleteTableColumn = () => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (editor) {
            editor.chain().focus().setImage({ src: e.target.result }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run();
  };

  // Export as PDF function
  const exportAsPDF = () => {
    const content = editor?.getHTML();
    if (!content) return;

    // Create a temporary div to render HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.5';
    document.body.appendChild(tempDiv);

    // Initialize jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(proposalTitle, margin, yPosition);
    yPosition += 15;

    // Convert HTML content to text and add to PDF
    const textContent = tempDiv.innerText || tempDiv.textContent;
    const lines = pdf.splitTextToSize(textContent, pageWidth - 2 * margin);
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');

    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(lines[i], margin, yPosition);
      yPosition += 6;
    }

    // Clean up
    document.body.removeChild(tempDiv);

    // Download PDF
    pdf.save(`${proposalTitle || 'proposal'}.pdf`);
  };

  // Export as DOC function
  const exportAsWord = async () => {
    const content = editor?.getHTML();
    if (!content) return;

    // Convert HTML to plain text and structure for DOCX
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Extract headings and paragraphs
    const elements = [];
    const children = tempDiv.children;

    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const tagName = element.tagName.toLowerCase();
      const text = element.innerText || element.textContent;

      if (tagName.startsWith('h')) {
        // Handle headings
        const level = parseInt(tagName.charAt(1));
        elements.push(
          new Paragraph({
            text: text,
            heading: level === 1 ? HeadingLevel.HEADING_1 : 
                    level === 2 ? HeadingLevel.HEADING_2 : 
                    level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          })
        );
      } else if (tagName === 'p' || tagName === 'div') {
        // Handle paragraphs
        elements.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      } else if (tagName === 'ul' || tagName === 'ol') {
        // Handle lists
        const listItems = element.querySelectorAll('li');
        listItems.forEach(item => {
          elements.push(
            new Paragraph({
              children: [new TextRun(`• ${item.innerText || item.textContent}`)],
            })
          );
        });
      }
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: proposalTitle,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            text: "",
          }),
          ...elements,
        ],
      }],
    });

    // Generate and download
    try {
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposalTitle || 'proposal'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    }
  };

  // Get editor content
  const getContent = () => {
    return editor?.getHTML() || '';
  };

  // Set editor content
  const setContent = (content) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  };

  // Expose methods via ref
  const editorRef = { getContent, setContent };

  return (
    <div className={`bg-white rounded-xl shadow-xl p-6 border border-orange-200 ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          Advanced Proposal Editor
        </h2>
      
        {/* Advanced Formatting Toolbar */}
        <div className="bg-orange-100 rounded-lg border border-orange-200 mb-4 overflow-hidden">
          {/* Top toolbar row */}
          <div className="p-2 border-b border-orange-200">
            <div className="flex flex-wrap gap-1 items-center">
              {/* Undo/Redo Group */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Y)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              {/* Basic Text Formatting */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    editor?.isActive('bold') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-2 rounded-lg text-sm italic transition-all duration-200 ${
                    editor?.isActive('italic') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`px-3 py-2 rounded-lg text-sm underline transition-all duration-200 ${
                    editor?.isActive('underline') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`px-3 py-2 rounded-lg text-sm line-through transition-all duration-200 ${
                    editor?.isActive('strike') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              {/* Script formatting */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('superscript') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Superscript"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSubscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('subscript') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Subscript"
                >
                  x₂
                </button>
              </div>

              {/* Headings */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    editor?.isActive('heading', { level: 1 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    editor?.isActive('heading', { level: 2 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    editor?.isActive('heading', { level: 3 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 3"
                >
                  H3
                </button>
              </div>

              {/* Lists */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('bulletList') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Bullet List"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M7 5h14v2H7zm0 6h14v2H7zm0 6h14v2H7zM3 5a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('orderedList') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Numbered List"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                  </svg>
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'left' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Left"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'center' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Center"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm6 4h6v2H9V7zm-6 4h18v2H3v-2zm6 4h6v2H9v-2zm-6 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'right' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Right"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'justify' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Justify"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
                  </svg>
                </button>
              </div>

              {/* Block Elements */}
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('blockquote') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Quote"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('codeBlock') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Code Block"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('code') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Inline Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setHardBreak().run()}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Line Break"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Second toolbar row - Advanced features */}
          <div className="p-2">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Table Management */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertTable}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Table"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0M8 21V7M16 21V7M3 11h18M3 15h18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addTableRow}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Add Table Row"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={deleteTableRow}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Delete Table Row"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addTableColumn}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Add Table Column"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={deleteTableColumn}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Delete Table Column"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Media Insert */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertImage}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>

              {/* Export Options */}
              {showExportButtons && (
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={exportAsPDF}
                    className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 flex items-center gap-2"
                    title="Export as PDF"
                  >
                    <svg className="w-5 h-5" fill="black" stroke="none" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z"/>
                    </svg>
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={exportAsWord}
                    className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 flex items-center gap-2"
                    title="Export as Word Document"
                  >
                    <svg className="w-5 h-5" fill="black" stroke="none" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 16.5L8 11h1.5l1 3.5L12 11h1.5l-1.5 5.5H10.5l-.5-2-.5 2H9.5zM14 9V4l5 5h-4z"/>
                    </svg>
                    DOC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor Content Area */}
        <div className="prose max-w-none">
          <div className="border border-gray-200 rounded-xl min-h-[600px] p-8 bg-white shadow-inner">
            <EditorContent 
              editor={editor} 
              className="focus:outline-none min-h-[550px] text-black leading-relaxed"
            />
          </div>
        </div>
        
        {/* Bottom Statistics and Guidelines */}
        {showStats && (
          <div className="mt-8 space-y-6">
            {/* Editor Statistics */}
            <div className="pt-4 border-t border-orange-200">
              <div className="flex justify-between items-start">
                <div className="flex gap-6 text-sm text-black">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <strong>{wordCount} words</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <strong>{characterCount} characters</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-black">
                    Last saved: {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Document will be auto-saved
                  </div>
                </div>
              </div>
            </div>
            
            {/* Proposal Guidelines */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-black mb-2 flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Essential Sections for Coal R&D Proposals
              </h4>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-black">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Problem Statement & Research Gap
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Research Objectives & Goals
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Justification & Strategic Significance
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Expected Outcomes & Impact
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Research Methodology & Approach
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Work Plan & Implementation
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Budget Breakdown & Timeline
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Technical Specifications & Data
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
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Link } from '@tiptap/extension-link';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Blockquote } from '@tiptap/extension-blockquote';
import { History } from '@tiptap/extension-history';
import { HardBreak } from '@tiptap/extension-hard-break';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const AdvancedProposalEditor = ({ 
  initialContent = '', 
  onContentChange = () => {}, 
  onWordCountChange = () => {},
  onCharacterCountChange = () => {},
  proposalTitle = 'Research Proposal',
  showStats = true,
  showExportButtons = true,
  className = ''
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  // Rich text editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      // Basic formatting
      Underline,
      Strike,
      Subscript,
      Superscript,
      // Text alignment
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      // Block elements
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-orange-500 pl-4 italic text-gray-700 bg-orange-50 py-2',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm',
        },
      }),
      // Tables
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      // Media
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
        },
      }),
      // Code
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600',
        },
      }),
      // Utilities
      CharacterCount,
      HardBreak,
    ],
    content: initialContent || `
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">1. Problem Statement & Research Gap</h2>
      <p style="color: #374151; line-height: 1.6;">Coal remains a critical energy source for India, contributing approximately 44% of the country's energy mix. However, traditional coal utilization methods face significant challenges including low efficiency, high emissions, and environmental concerns. This proposal addresses the urgent need for advanced coal gasification technologies that can enhance energy conversion efficiency while minimizing environmental impact...</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">2. Research Objectives</h2>
      <p style="color: #374151; line-height: 1.6;"><strong>Primary Objectives:</strong></p>
      <ul style="color: #374151; margin-left: 20px;">
        <li>Develop advanced coal gasification technology with 85%+ efficiency</li>
        <li>Reduce CO₂ emissions by 40% compared to conventional methods</li>
        <li>Create integrated carbon capture and utilization systems</li>
      </ul>
      <p style="color: #374151; line-height: 1.6;"><strong>Secondary Objectives:</strong></p>
      <ul style="color: #374151; margin-left: 20px;">
        <li>Optimize process parameters for Indian coal varieties</li>
        <li>Develop cost-effective catalyst systems</li>
        <li>Establish pilot-scale demonstration facility</li>
      </ul>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">3. Justification & Strategic Significance</h2>
      <p style="color: #374151; line-height: 1.6;">This research directly supports India's commitment to achieving net-zero emissions by 2070 while maintaining energy security. Advanced coal gasification technology will enable cleaner coal utilization, supporting the transition to sustainable energy systems. The technology has potential applications across thermal power plants, steel manufacturing, and chemical industries...</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">4. Expected Outcomes & Impact</h2>
      <p style="color: #374151; line-height: 1.6;"><strong>Technical Outcomes:</strong></p>
      <ul style="color: #374151; margin-left: 20px;">
        <li>Proprietary gasification reactor design with enhanced efficiency</li>
        <li>Advanced catalyst formulations for Indian coal types</li>
        <li>Integrated carbon capture and utilization protocols</li>
        <li>Comprehensive process optimization guidelines</li>
      </ul>
      <p style="color: #374151; line-height: 1.6;"><strong>Societal Impact:</strong> Reduced air pollution, job creation in clean technology sector, enhanced energy security, and contribution to climate goals.</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">5. Research Methodology</h2>
      <p style="color: #374151; line-height: 1.6;">Our comprehensive methodology encompasses:</p>
      <ol style="color: #374151; margin-left: 20px;">
        <li><strong>Coal Characterization:</strong> Advanced analytical techniques including XRF, XRD, FTIR, and thermogravimetric analysis</li>
        <li><strong>Reactor Design:</strong> CFD modeling and experimental validation of gasification reactor configurations</li>
        <li><strong>Catalyst Development:</strong> Synthesis and characterization of novel catalyst systems</li>
        <li><strong>Process Optimization:</strong> Response surface methodology and machine learning approaches</li>
        <li><strong>Pilot Testing:</strong> Scale-up studies and continuous operation trials</li>
      </ol>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">6. Work Plan & Implementation Strategy</h2>
      <p style="color: #374151; line-height: 1.6;"><strong>Phase 1 (Months 1-12):</strong> Literature review, coal characterization, preliminary reactor design</p>
      <p style="color: #374151; line-height: 1.6;"><strong>Phase 2 (Months 13-24):</strong> Catalyst development, lab-scale reactor testing, process optimization</p>
      <p style="color: #374151; line-height: 1.6;"><strong>Phase 3 (Months 25-36):</strong> Pilot-scale demonstration, technology validation, commercialization roadmap</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">7. Budget Breakdown</h2>
      <p style="color: #374151; line-height: 1.6;">Insert detailed budget table using the Table button above. Include personnel costs, equipment, materials, travel, and overhead expenses.</p>
      
      <h2 style="color: #1e40af; font-weight: bold; margin: 24px 0 12px 0;">8. Project Timeline & Milestones</h2>
      <p style="color: #374151; line-height: 1.6;">Detailed project timeline with quarterly milestones, deliverables, and key performance indicators. Include risk assessment and mitigation strategies for each phase.</p>
    `,
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setWordCount(words);
        setCharacterCount(characters);
        onWordCountChange(words);
        onCharacterCountChange(characters);
      }
      // Call parent content change handler
      onContentChange(editor.getHTML());
    },
  });

  // Update counts when editor is ready
  useEffect(() => {
    if (editor && editor.storage.characterCount) {
      const words = editor.storage.characterCount.words();
      const characters = editor.storage.characterCount.characters();
      setWordCount(words);
      setCharacterCount(characters);
      onWordCountChange(words);
      onCharacterCountChange(characters);
    }
  }, [editor, onWordCountChange, onCharacterCountChange]);

  // Editor Utility Functions
  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const addTableRow = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  const deleteTableRow = () => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
    }
  };

  const addTableColumn = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const deleteTableColumn = () => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (editor) {
            editor.chain().focus().setImage({ src: e.target.result }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run();
  };

  // Export as PDF function
  const exportAsPDF = () => {
    const content = editor?.getHTML();
    if (!content) return;

    // Create a temporary div to render HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.5';
    document.body.appendChild(tempDiv);

    // Initialize jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(proposalTitle, margin, yPosition);
    yPosition += 15;

    // Convert HTML content to text and add to PDF
    const textContent = tempDiv.innerText || tempDiv.textContent;
    const lines = pdf.splitTextToSize(textContent, pageWidth - 2 * margin);
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');

    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(lines[i], margin, yPosition);
      yPosition += 6;
    }

    // Clean up
    document.body.removeChild(tempDiv);

    // Download PDF
    pdf.save(`${proposalTitle || 'proposal'}.pdf`);
  };

  // Export as DOC function
  const exportAsWord = async () => {
    const content = editor?.getHTML();
    if (!content) return;

    // Convert HTML to plain text and structure for DOCX
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Extract headings and paragraphs
    const elements = [];
    const children = tempDiv.children;

    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const tagName = element.tagName.toLowerCase();
      const text = element.innerText || element.textContent;

      if (tagName.startsWith('h')) {
        // Handle headings
        const level = parseInt(tagName.charAt(1));
        elements.push(
          new Paragraph({
            text: text,
            heading: level === 1 ? HeadingLevel.HEADING_1 : 
                    level === 2 ? HeadingLevel.HEADING_2 : 
                    level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          })
        );
      } else if (tagName === 'p' || tagName === 'div') {
        // Handle paragraphs
        elements.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      } else if (tagName === 'ul' || tagName === 'ol') {
        // Handle lists
        const listItems = element.querySelectorAll('li');
        listItems.forEach(item => {
          elements.push(
            new Paragraph({
              children: [new TextRun(`• ${item.innerText || item.textContent}`)],
            })
          );
        });
      }
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: proposalTitle,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            text: "",
          }),
          ...elements,
        ],
      }],
    });

    // Generate and download
    try {
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposalTitle || 'proposal'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    }
  };

  // Get editor content
  const getContent = () => {
    return editor?.getHTML() || '';
  };

  // Set editor content
  const setContent = (content) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  };

  // Expose methods via ref
  const editorRef = { getContent, setContent };

  return (
    <div className={`bg-white rounded-xl shadow-xl p-6 border border-orange-200 ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          Advanced Proposal Editor
        </h2>
      
        {/* Advanced Formatting Toolbar */}
        <div className="bg-orange-100 rounded-lg border border-orange-200 mb-4 overflow-hidden">
          {/* Top toolbar row */}
          <div className="p-2 border-b border-orange-200">
            <div className="flex flex-wrap gap-1 items-center">
              {/* Undo/Redo Group */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Y)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              {/* Basic Text Formatting */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    editor?.isActive('bold') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-2 rounded-lg text-sm italic transition-all duration-200 ${
                    editor?.isActive('italic') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`px-3 py-2 rounded-lg text-sm underline transition-all duration-200 ${
                    editor?.isActive('underline') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`px-3 py-2 rounded-lg text-sm line-through transition-all duration-200 ${
                    editor?.isActive('strike') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              {/* Script formatting */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('superscript') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Superscript"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSubscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('subscript') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Subscript"
                >
                  x₂
                </button>
              </div>

              {/* Headings */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    editor?.isActive('heading', { level: 1 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    editor?.isActive('heading', { level: 2 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    editor?.isActive('heading', { level: 3 }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 3"
                >
                  H3
                </button>
              </div>

              {/* Lists */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('bulletList') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Bullet List"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M7 5h14v2H7zm0 6h14v2H7zm0 6h14v2H7zM3 5a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('orderedList') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Numbered List"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                  </svg>
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'left' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Left"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'center' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Center"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm6 4h6v2H9V7zm-6 4h18v2H3v-2zm6 4h6v2H9v-2zm-6 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'right' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Align Right"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive({ textAlign: 'justify' }) 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Justify"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
                  </svg>
                </button>
              </div>

              {/* Block Elements */}
              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('blockquote') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Quote"
                >
                  <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('codeBlock') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Code Block"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    editor?.isActive('code') 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Inline Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setHardBreak().run()}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Line Break"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Second toolbar row - Advanced features */}
          <div className="p-2">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Table Management */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertTable}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Table"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0M8 21V7M16 21V7M3 11h18M3 15h18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addTableRow}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Add Table Row"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={deleteTableRow}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Delete Table Row"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addTableColumn}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Add Table Column"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={deleteTableColumn}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Delete Table Column"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Media Insert */}
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertImage}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>

              {/* Export Options */}
              {showExportButtons && (
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={exportAsPDF}
                    className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 flex items-center gap-2"
                    title="Export as PDF"
                  >
                    <svg className="w-5 h-5" fill="black" stroke="none" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z"/>
                    </svg>
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={exportAsWord}
                    className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 flex items-center gap-2"
                    title="Export as Word Document"
                  >
                    <svg className="w-5 h-5" fill="black" stroke="none" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 16.5L8 11h1.5l1 3.5L12 11h1.5l-1.5 5.5H10.5l-.5-2-.5 2H9.5zM14 9V4l5 5h-4z"/>
                    </svg>
                    DOC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor Content Area */}
        <div className="prose max-w-none">
          <div className="border border-gray-200 rounded-xl min-h-[600px] p-8 bg-white shadow-inner">
            <EditorContent 
              editor={editor} 
              className="focus:outline-none min-h-[550px] text-black leading-relaxed"
            />
          </div>
        </div>
        
        {/* Bottom Statistics and Guidelines */}
        {showStats && (
          <div className="mt-8 space-y-6">
            {/* Editor Statistics */}
            <div className="pt-4 border-t border-orange-200">
              <div className="flex justify-between items-start">
                <div className="flex gap-6 text-sm text-black">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <strong>{wordCount} words</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <strong>{characterCount} characters</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-black">
                    Last saved: {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Document will be auto-saved
                  </div>
                </div>
              </div>
            </div>
            
            {/* Proposal Guidelines */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-black mb-2 flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Essential Sections for Coal R&D Proposals
              </h4>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-black">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Problem Statement & Research Gap
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Research Objectives & Goals
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Justification & Strategic Significance
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Expected Outcomes & Impact
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Research Methodology & Approach
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Work Plan & Implementation
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Budget Breakdown & Timeline
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  Technical Specifications & Data
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
