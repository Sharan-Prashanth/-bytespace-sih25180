import React from 'react';
import { Plate } from '@udecode/plate-common';
import { createPlateEditor } from '@udecode/plate-common';

const ViewOnlyEditor = ({ content }) => {
  // Create a read-only editor instance
  const editor = createPlateEditor({
    readOnly: true
  });

  // Parse content - handle both JSON array and object formats
  const parseContent = () => {
    if (!content) return [];
    
    // If content has a 'formi' property with content inside
    if (content.formi && content.formi.content) {
      return content.formi.content;
    }
    
    // If content is already an array
    if (Array.isArray(content)) {
      return content;
    }
    
    // If content is a string, try to parse it
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.formi && parsed.formi.content) return parsed.formi.content;
      } catch (e) {
        console.error('Failed to parse content string:', e);
      }
    }
    
    return [];
  };

  const editorContent = parseContent();

  // Render Plate.js content as HTML
  const renderContent = (nodes) => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return <p className="text-black">No content available.</p>;
    }

    return nodes.map((node, index) => {
      if (node.type === 'h1') {
        return (
          <h1 key={index} className="text-3xl font-bold text-black mb-4 mt-6">
            {node.children.map((child, i) => child.text).join('')}
          </h1>
        );
      }
      
      if (node.type === 'h2') {
        return (
          <h2 key={index} className="text-2xl font-bold text-black mb-3 mt-5">
            {node.children.map((child, i) => child.text).join('')}
          </h2>
        );
      }
      
      if (node.type === 'h3') {
        return (
          <h3 key={index} className="text-xl font-bold text-black mb-2 mt-4">
            {node.children.map((child, i) => child.text).join('')}
          </h3>
        );
      }
      
      if (node.type === 'p') {
        const text = node.children.map((child) => {
          if (child.bold) {
            return <strong key={Math.random()}>{child.text}</strong>;
          }
          if (child.italic) {
            return <em key={Math.random()}>{child.text}</em>;
          }
          if (child.underline) {
            return <u key={Math.random()}>{child.text}</u>;
          }
          return child.text;
        });
        
        return (
          <p key={index} className="text-black mb-3 leading-relaxed">
            {text}
          </p>
        );
      }
      
      if (node.type === 'ul') {
        return (
          <ul key={index} className="list-disc list-inside text-black mb-3 ml-4">
            {node.children.map((li, liIndex) => (
              <li key={liIndex} className="mb-1">
                {li.children.map((child) => child.text).join('')}
              </li>
            ))}
          </ul>
        );
      }
      
      if (node.type === 'ol') {
        return (
          <ol key={index} className="list-decimal list-inside text-black mb-3 ml-4">
            {node.children.map((li, liIndex) => (
              <li key={liIndex} className="mb-1">
                {li.children.map((child) => child.text).join('')}
              </li>
            ))}
          </ol>
        );
      }
      
      if (node.type === 'table') {
        return (
          <div key={index} className="overflow-x-auto mb-4">
            <table className="min-w-full border border-black/20">
              <tbody>
                {node.children.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.children.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-black/20 px-4 py-2 text-black">
                        {cell.children.map((child) => child.text).join('')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      // Default case
      return (
        <p key={index} className="text-black mb-3">
          {node.children ? node.children.map((child) => child.text || '').join('') : ''}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
      {/* View-Only Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">View-Only Mode</h4>
            <p className="text-sm text-blue-800">
              This proposal is displayed in read-only mode. You cannot make any changes to the content.
              To edit this proposal, please go to the edit page.
            </p>
          </div>
        </div>
      </div>

      {/* Editor Header */}
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-black/5 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-black">Proposal Content</h2>
      </div>

      {/* Content Area */}
      <div className="prose max-w-none">
        <div className="p-6 border border-black/10 rounded-lg bg-white min-h-[400px]">
          {renderContent(editorContent)}
        </div>
      </div>
    </div>
  );
};

export default ViewOnlyEditor;
