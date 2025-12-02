'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { EditorKit } from '@/components/ProposalEditor/editor (plate files)/editor-kit';
import { Editor, EditorContainer } from '@/components/ui (plate files)/editor';
import { FixedToolbarButtons } from '@/components/ui (plate files)/fixed-toolbar-buttons';
import { FixedToolbar } from '@/components/ui (plate files)/fixed-toolbar';

// Default content for new reports
const DEFAULT_REPORT_CONTENT = [
  {
    type: 'h2',
    children: [{ text: 'Review Summary' }]
  },
  {
    type: 'p',
    children: [{ text: '' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Technical Assessment' }]
  },
  {
    type: 'p',
    children: [{ text: '' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Budget Evaluation' }]
  },
  {
    type: 'p',
    children: [{ text: '' }]
  },
  {
    type: 'h2',
    children: [{ text: 'Recommendations' }]
  },
  {
    type: 'p',
    children: [{ text: '' }]
  }
];

// Extract plain text from Plate.js nodes
const extractPlainText = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return '';
  
  return nodes.map(node => {
    if (node.text !== undefined) return node.text;
    if (node.children) return extractPlainText(node.children);
    return '';
  }).join(' ').replace(/\s+/g, ' ').trim();
};

// Count words in text
const countWords = (text) => {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Convert Plate.js nodes to HTML
const nodesToHtml = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return '';
  
  return nodes.map(node => {
    if (node.text !== undefined) {
      let text = node.text;
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      if (node.underline) text = `<u>${text}</u>`;
      if (node.strikethrough) text = `<s>${text}</s>`;
      return text;
    }
    
    const childrenHtml = node.children ? nodesToHtml(node.children) : '';
    
    switch (node.type) {
      case 'h1':
        return `<h1>${childrenHtml}</h1>`;
      case 'h2':
        return `<h2>${childrenHtml}</h2>`;
      case 'h3':
        return `<h3>${childrenHtml}</h3>`;
      case 'p':
        return `<p>${childrenHtml}</p>`;
      case 'ul':
        return `<ul>${childrenHtml}</ul>`;
      case 'ol':
        return `<ol>${childrenHtml}</ol>`;
      case 'li':
        return `<li>${childrenHtml}</li>`;
      case 'blockquote':
        return `<blockquote>${childrenHtml}</blockquote>`;
      case 'a':
        return `<a href="${node.url || '#'}">${childrenHtml}</a>`;
      default:
        return childrenHtml;
    }
  }).join('');
};

const SimpleReportEditor = ({ 
  content = null, 
  onChange,
  placeholder = 'Write your review report here...',
  minCharacters = 100
}) => {
  // Get initial content
  const initialValue = useMemo(() => {
    if (content && Array.isArray(content) && content.length > 0) {
      return content;
    }
    return DEFAULT_REPORT_CONTENT;
  }, [content]);

  // Create Plate editor
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  }, []);

  // Handle content change
  const handleChange = useCallback(({ value }) => {
    if (!onChange) return;
    
    const text = extractPlainText(value);
    const html = nodesToHtml(value);
    const words = countWords(text);
    const characters = text.length;
    
    onChange({
      html,
      text,
      json: value,
      characters,
      words
    });
  }, [onChange]);

  // Calculate stats from current content
  const currentText = extractPlainText(editor?.children || []);
  const characterCount = currentText.length;
  const wordCount = countWords(currentText);

  return (
    <div className="border border-black/20 rounded-lg overflow-hidden">
      <Plate 
        editor={editor}
        onChange={handleChange}
      >
        <EditorContainer className="border-none">
          {/* Toolbar */}
          <FixedToolbar className="border-b border-black/10">
            <FixedToolbarButtons />
          </FixedToolbar>
          
          {/* Editor */}
          <Editor 
            placeholder={placeholder}
            className="min-h-[250px] px-4 py-3"
          />
        </EditorContainer>
      </Plate>

      {/* Character Count Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/5 border-t border-black/10 text-xs">
        <span className={`${characterCount < minCharacters ? 'text-red-600' : 'text-black'}`}>
          {characterCount} characters
          {characterCount < minCharacters && ` (minimum ${minCharacters} recommended)`}
        </span>
        <span className="text-black">
          {wordCount} words
        </span>
      </div>
    </div>
  );
};

export default SimpleReportEditor;
