import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import axios from 'axios';

/**
 * Convert Plate.js content to plain text, or return string content as-is
 */
const plateToText = (content, level = 0) => {
  // If content is already a string, return it
  if (typeof content === 'string') {
    return content;
  }
  
  if (!Array.isArray(content)) return '';
  
  let text = '';
  
  for (const node of content) {
    if (node.type === 'p') {
      const paragraphText = node.children?.map(child => child.text || '').join('') || '';
      text += paragraphText + '\n\n';
    } else if (node.type === 'h1' || node.type === 'h2' || node.type === 'h3') {
      const headingText = node.children?.map(child => child.text || '').join('') || '';
      text += headingText + '\n\n';
    } else if (node.type === 'ul' || node.type === 'ol') {
      text += plateToText(node.children, level + 1);
    } else if (node.type === 'li') {
      const indent = '  '.repeat(level);
      const listText = node.children?.map(child => child.text || '').join('') || '';
      text += indent + '• ' + listText + '\n';
    } else if (node.children) {
      text += plateToText(node.children, level);
    }
  }
  
  return text;
};

/**
 * Generate PDF from Plate.js content
 */
export const generatePDFFromPlateContent = async (content, title, metadata = {}) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Add header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NaCCER Research Portal', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Clarification Report', margin, yPosition);
  yPosition += 10;

  // Add metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  if (metadata.proposalCode) {
    pdf.text(`Proposal Code: ${metadata.proposalCode}`, margin, yPosition);
    yPosition += 6;
  }
  
  if (metadata.committeeType) {
    pdf.text(`Committee: ${metadata.committeeType}`, margin, yPosition);
    yPosition += 6;
  }
  
  if (metadata.createdBy) {
    pdf.text(`Created By: ${metadata.createdBy}`, margin, yPosition);
    yPosition += 6;
  }
  
  if (metadata.createdAt) {
    pdf.text(`Date: ${new Date(metadata.createdAt).toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
  }

  // Add separator
  pdf.setDrawColor(200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const splitTitle = pdf.splitTextToSize(title, maxWidth);
  pdf.text(splitTitle, margin, yPosition);
  yPosition += (splitTitle.length * 7) + 5;

  // Add content
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const textContent = plateToText(content);
  const splitContent = pdf.splitTextToSize(textContent, maxWidth);
  
  for (let i = 0; i < splitContent.length; i++) {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.text(splitContent[i], margin, yPosition);
    yPosition += 6;
  }

  // Add signature if provided
  if (metadata.signature) {
    yPosition += 10;
    
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Committee Signature:', margin, yPosition);
    yPosition += 10;
    
    try {
      // Add signature image (data URL)
      pdf.addImage(metadata.signature, 'PNG', margin, yPosition, 50, 20);
      yPosition += 25;
    } catch (err) {
      console.error('Error adding signature to PDF:', err);
    }
  }

  // Add seal if provided
  if (metadata.seal) {
    yPosition += 5;
    
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
    }
    
    try {
      // Download and add seal image
      const sealResponse = await axios.get(metadata.seal, { responseType: 'arraybuffer' });
      const sealBase64 = Buffer.from(sealResponse.data, 'binary').toString('base64');
      pdf.addImage(`data:image/png;base64,${sealBase64}`, 'PNG', margin, yPosition, 40, 40);
    } catch (err) {
      console.error('Error adding seal to PDF:', err);
    }
  }

  // Return PDF as buffer
  return Buffer.from(pdf.output('arraybuffer'));
};

/**
 * Convert Plate.js content to DOCX paragraphs, or handle string content
 */
const plateToDocxParagraphs = (content) => {
  const paragraphs = [];
  
  // If content is a string, split by lines and create paragraphs
  if (typeof content === 'string') {
    const lines = content.split('\n');
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          text: line,
          spacing: { after: 100 }
        })
      );
    }
    return paragraphs;
  }
  
  if (!Array.isArray(content)) return paragraphs;
  
  for (const node of content) {
    if (node.type === 'p') {
      const textRuns = (node.children || []).map(child => 
        new TextRun({
          text: child.text || '',
          bold: child.bold || false,
          italics: child.italic || false,
          underline: child.underline ? {} : undefined
        })
      );
      
      paragraphs.push(
        new Paragraph({
          children: textRuns.length > 0 ? textRuns : [new TextRun({ text: '' })],
          spacing: { after: 200 }
        })
      );
    } else if (node.type === 'h1') {
      const text = node.children?.map(child => child.text || '').join('') || '';
      paragraphs.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
    } else if (node.type === 'h2') {
      const text = node.children?.map(child => child.text || '').join('') || '';
      paragraphs.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        })
      );
    } else if (node.type === 'h3') {
      const text = node.children?.map(child => child.text || '').join('') || '';
      paragraphs.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 200 }
        })
      );
    } else if (node.type === 'ul' || node.type === 'ol') {
      paragraphs.push(...plateToDocxParagraphs(node.children));
    } else if (node.type === 'li') {
      const text = node.children?.map(child => child.text || '').join('') || '';
      paragraphs.push(
        new Paragraph({
          text: text,
          bullet: { level: 0 },
          spacing: { after: 100 }
        })
      );
    } else if (node.children) {
      paragraphs.push(...plateToDocxParagraphs(node.children));
    }
  }
  
  return paragraphs;
};

/**
 * Generate DOCX from Plate.js content
 */
export const generateDOCXFromPlateContent = async (content, title, metadata = {}) => {
  const sections = [];
  
  // Header
  sections.push(
    new Paragraph({
      text: 'NaCCER Research Portal',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: 'Clarification Report',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Metadata
  if (metadata.proposalCode) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Proposal Code: ', bold: true }),
          new TextRun({ text: metadata.proposalCode })
        ],
        spacing: { after: 100 }
      })
    );
  }
  
  if (metadata.committeeType) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Committee: ', bold: true }),
          new TextRun({ text: metadata.committeeType })
        ],
        spacing: { after: 100 }
      })
    );
  }
  
  if (metadata.createdBy) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Created By: ', bold: true }),
          new TextRun({ text: metadata.createdBy })
        ],
        spacing: { after: 100 }
      })
    );
  }
  
  if (metadata.createdAt) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Date: ', bold: true }),
          new TextRun({ text: new Date(metadata.createdAt).toLocaleDateString() })
        ],
        spacing: { after: 400 }
      })
    );
  }

  // Title
  sections.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 }
    })
  );

  // Content
  const contentParagraphs = plateToDocxParagraphs(content);
  sections.push(...contentParagraphs);

  // Signature
  if (metadata.signature) {
    sections.push(
      new Paragraph({
        text: '',
        spacing: { before: 600 }
      }),
      new Paragraph({
        text: 'Committee Signature:',
        bold: true,
        spacing: { after: 200 }
      })
    );
    
    try {
      // Convert data URL to buffer
      const base64Data = metadata.signature.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      sections.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 200,
                height: 80
              }
            })
          ],
          spacing: { after: 200 }
        })
      );
    } catch (err) {
      console.error('Error adding signature to DOCX:', err);
    }
  }

  // Seal
  if (metadata.seal) {
    try {
      const sealResponse = await axios.get(metadata.seal, { responseType: 'arraybuffer' });
      const sealBuffer = Buffer.from(sealResponse.data);
      
      sections.push(
        new Paragraph({
          text: '',
          spacing: { before: 200 }
        }),
        new Paragraph({
          children: [
            new ImageRun({
              data: sealBuffer,
              transformation: {
                width: 150,
                height: 150
              }
            })
          ]
        })
      );
    } catch (err) {
      console.error('Error adding seal to DOCX:', err);
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections
      }
    ]
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
};
