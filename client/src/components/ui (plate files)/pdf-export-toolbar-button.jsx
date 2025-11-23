'use client';
import * as React from 'react';

import { ArrowDownToLineIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function PdfExportToolbarButton(props) {
  const editor = useEditorRef();
  const [isExporting, setIsExporting] = React.useState(false);

  const getCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas-pro');

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

    return canvas;
  };

  const downloadFile = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
  };

  const exportToPdf = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const canvas = await getCanvas();

      const PDFLib = await import('pdf-lib');
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
      const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

      await downloadFile(pdfBase64, 'proposal.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ToolbarButton 
      onClick={exportToPdf} 
      tooltip={isExporting ? "Exporting..." : "Export as PDF"}
      disabled={isExporting}
      {...props}
    >
      <ArrowDownToLineIcon className="size-4" />
    </ToolbarButton>
  );
}
