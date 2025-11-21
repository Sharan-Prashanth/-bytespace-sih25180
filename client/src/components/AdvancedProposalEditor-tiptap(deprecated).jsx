import { useState, useEffect, useMemo } from "react";
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
import { HardBreak } from '@tiptap/extension-hard-break';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const formIAContent = `
  <div style="color: black; font-family: Arial, sans-serif; line-height:1.5; padding: 16px;">
    <h1 style="text-align: center; color: black; margin-bottom: 6px;">FORM – IA</h1>
    <h2 style="text-align: center; color: black; font-size:18px; margin-top:0;">ENDORSEMENT FROM<br/>THE HEAD OF THE INSTITUTION</h2>
    <p style="text-align: center; font-style: italic; margin-top: 4px;">(To be given on the letter head)</p>

    <div style="margin-top: 18px;">
      <p><strong>Project Title:</strong></p>
      <p style="border: 1px solid #ccc; padding: 8px; min-height: 30px;">&nbsp;</p>
              </div>

    <div style="margin-top: 16px;">
      <ol style="padding-left: 20px; color: black;">
        <li style="margin-bottom: 8px;">
          <strong>Certified that the Company/Institute intends to undertake above project with Dr/Sri/Smt</strong>
          <span style="border-bottom: 1px solid #000; padding: 0 12px;">&nbsp;..........................................................&nbsp;</span>
          <strong>as a Project Leader/Coordinator/Principal Investigator of the project.</strong>
        </li>

        <li style="margin-bottom: 8px;">
          <strong>Certified that necessary infrastructure facilities shall be made available to Project Team.</strong>
          <div style="margin-top:6px; margin-left: 4px;">
            Accommodation, transport, manpower etc. will be provided at the project site to the research team for undertaking the field work.
          </div>
        </li>

        <li style="margin-bottom: 8px;">
          <strong>Certified that equipment proposed to be procured from the S&T Grant are not readily available in the Company/Institute for the purpose.</strong>
        </li>

        <li style="margin-bottom: 8px;">
          <strong>The company/Institute assumes to undertake the financial and other management responsibilities of the project.</strong>
        </li>
      </ol>
            </div>
            
    <div style="margin-top: 28px;">
      <p style="margin-bottom: 40px;">
        <strong>Name and signature of Head of the Company/Institution</strong><br/>
        <span style="font-style: italic;">(With seal)</span>
      </p>

      <table style="width:100%; border-collapse: collapse; color: black;">
        <tr>
          <td style="width:50%; padding: 8px; vertical-align: top;">
            <p style="margin:0;"><strong>Date:</strong></p>
            <p style="border-bottom:1px solid #000; height:20px; margin-top:6px;">&nbsp;</p>
          </td>
          <td style="width:50%; padding: 8px; vertical-align: top;">
            <p style="margin:0;"><strong>Place:</strong></p>
            <p style="border-bottom:1px solid #000; height:20px; margin-top:6px;">&nbsp;</p>
          </td>
        </tr>
      </table>
                </div>
                </div>
`;

const formIXContent = `
  <div style="color: black; font-family: Arial, sans-serif; line-height:1.5; padding: 16px;">

    <h1 style="text-align: center; color: black; margin-bottom: 6px;">FORM – IX</h1>

    <h2 style="color: black; text-align: center; font-size:18px; margin-top:0;">
      Details of Equipment other than Computer Hardware / Software already procured<br/>
      under S&T Scheme of Ministry of Coal / R&D Fund of CIL in the past<br/>
      (Related to the below-mentioned S&T Project)
    </h2>

    <div style="margin-top: 20px;">
      <p><strong>Name of the Project:</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Project Code:</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Principal Implementing Agency(s):</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Sub Implementing Agency(s):</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>
    </div>

    <h2 style="color:black; margin-top:30px;">Equipment Details</h2>

    <table border="1" style="width:100%; border-collapse: collapse; color:black; text-align:center; font-size:14px;">
      <tr>
        <th>Sl. No</th>
        <th>Details of Equipment</th>
        <th>No. of Sets</th>
        <th>Make & Model</th>
        <th>Year of Procurement</th>
        <th>S&T/R&D Project Against Which Procured</th>
        <th>Status of Equipment</th>
        <th>Remarks</th>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </table>

    <h2 style="color:black; margin-top:30px;">Note:</h2>

    <ul style="color:black; padding-left:20px;">
      <li>
        A list of all equipment procured for the last seven years from S&T/R&D Fund giving the status and its present utilisation.
      </li>
      <li>
        The status should indicate whether the equipment is in working condition or under breakdown. If under breakdown, state whether it can be repaired and used in this research project.
      </li>
      <li>
        Provide detailed justification for procurement of additional equipment when similar equipment had been procured earlier under other S&T/R&D funding.
      </li>
      <li>
        This form should be signed by the Project Leader and Project Coordinator and incorporated in the project proposal.
      </li>
    </ul>

  </div>
`;
  const formXIContent = `
    <div style="color: black; font-family: Arial, sans-serif; line-height:1.5; padding: 16px;">

      <h1 style="text-align: center; color: black; margin-bottom: 6px;">FORM – XI</h1>

      <h2 style="color: black; text-align: center; font-size:18px; margin-top:0;">
        DETAILS OF MANPOWER COST (SALARY AND WAGES)
      </h2>

      <div style="margin-top: 20px;">
        <p><strong>Name of the Project:</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Project Code:</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Principal Implementing Agency(s):</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Sub Implementing Agency(s):</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>
      </div>

      <h2 style="color:black; margin-top:30px;">Manpower Cost Details</h2>

      <table border="1" style="width:100%; border-collapse: collapse; color:black; text-align:center; font-size:14px;">
        <tr>
          <th>Sl. No.</th>
          <th>Designation</th>
          <th>No. of Persons</th>
          <th>Total No. of Months Required / Person</th>
          <th>Salary per Month (Rs.)</th>
          <th>Total Salary (3 × 4 × 5) (Rs.)</th>
          <th>1st Year (Rs.)</th>
          <th>2nd Year (Rs.)</th>
          <th>3rd Year (Rs.)</th>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </table>

      <h2 style="color:black; margin-top:30px;">Note:</h2>

      <ul style="color:black; padding-left:20px;">
        <li>
          Engagement of personnel (Research Associate/Research Assistant/Research Fellow/JRF/SRF) shall be the responsibility of the Principal or Sub-implementing Agencies.  
          Payment must follow the approved norms/guidelines of the respective institution.
        </li>

        <li>
          Salaries of permanent employees of Principal Implementing / Sub-implementing Agencies are <strong>not admissible</strong>.
        </li>

        <li>
          This form must be jointly signed by the <strong>Project Leader/Coordinator</strong> and the <strong>Associated Finance Officer</strong>  
          of the implementing agency and incorporated in the project proposal.
        </li>
      </ul>

    </div>
  `;
  const formXContent = `
    <div style="color: black; font-family: Arial, sans-serif; line-height:1.5; padding: 16px;">

      <h1 style="text-align: center; color: black; margin-bottom: 6px;">FORM – X</h1>

      <h2 style="color: black; text-align: center; font-size:18px; margin-top:0;">
        Details of Computers, Software and Accessories already procured<br/>
        under S&T Scheme of Ministry of Coal / R&D Fund of CIL in the past<br/>
        (Related to the below-mentioned S&T Project)
      </h2>

      <div style="margin-top: 20px;">
        <p><strong>Name of the Project:</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Project Code:</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Principal Implementing Agency(s):</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

        <p style="margin-top: 12px;"><strong>Sub Implementing Agency(s):</strong></p>
        <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>
      </div>

      <h2 style="color:black; margin-top:30px;">Computer / Software Details</h2>

      <table border="1" style="width:100%; border-collapse: collapse; color:black; text-align:center; font-size:14px;">
        <tr>
          <th>Sl. No</th>
          <th>Details of Computers / Software</th>
          <th>No. of Sets</th>
          <th>Make & Model</th>
          <th>Year of Procurement</th>
          <th>S&T/R&D Project Against Which Procured</th>
          <th>Present Condition of Equipment / Instrument</th>
          <th>Remarks</th>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <td style="height:32px;"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </table>

      <h2 style="color:black; margin-top:30px;">Note:</h2>

      <ul style="color:black; padding-left:20px;">
        <li>
          A list of all computer & accessories procured for the last three years from S&T/R&D Fund giving the status and their present utilisation.
        </li>
        <li>
          The status should mention whether the equipment is in working condition or under breakdown.  
          If under breakdown, specify whether it can be repaired & used in this research project.
        </li>
        <li>
          Provide detailed justification for procurement of additional equipment when similar items were procured earlier under S&T/R&D funding.
        </li>
        <li>
          This form should be signed by the Project Leader and Project Coordinator and incorporated in the project proposal.
        </li>
      </ul>

    </div>
  `;
const formXIIContent = `
  <div style="color: black; font-family: Arial, sans-serif; line-height:1.5; padding: 16px;">

    <h1 style="text-align: center; color: black; margin-bottom: 6px;">FORM – XII</h1>

    <h2 style="color: black; text-align: center; font-size:18px; margin-top:0;">
      DETAILS OF TRAVEL EXPENDITURE (TA/DA)
    </h2>

    <div style="margin-top: 20px;">
      <p><strong>Name of the Project:</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Project Code:</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Principal Implementing Agency(s):</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>

      <p style="margin-top: 12px;"><strong>Sub Implementing Agency(s):</strong></p>
      <p style="border:1px solid #ccc; padding:8px; min-height:30px;">&nbsp;</p>
    </div>

    <h2 style="color:black; margin-top:30px;">Travel Expenditure Details (TA/DA)</h2>

    <table border="1" style="width:100%; border-collapse: collapse; color:black; text-align:center; font-size:14px;">
      <tr>
        <th>Sl. No</th>
        <th>Designation</th>
        <th>From (Place → Place)</th>
        <th>Approx. Distance (Km)</th>
        <th>Mode</th>
        <th>Fare (Rs.)</th>
        <th>No. of Trips</th>
        <th>Total Travel Expenses (5 × 6) (Rs.)</th>
        <th>No. of Days for DA</th>
        <th>Rate of DA per Day (Rs.)</th>
        <th>Total DA (8 × 9) (Rs.)</th>
        <th>Total TA + DA (7 + 10) (Rs.)</th>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr>
        <td style="height:32px;"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </table>

    <h2 style="color:black; margin-top:30px;">NB:</h2>

    <ul style="color:black; padding-left:20px;">
      <li>
        This form must be jointly signed by the <strong>Project Leader/Coordinator</strong>  
        and the <strong>Associated Finance Officer</strong> of the Principal Implementing Agency(s) / Sub-implementing Agency(s),  
        and incorporated in the project proposal.
      </li>
    </ul>

  </div>
`;
const TAB_DEFINITIONS = [
  {
    id: 'main',
    label: 'Proposal Body',
    description: 'Compose the primary content of the proposal',
    type: 'editor',
  },
  {
    id: 'form-ia',
    label: 'Form IA',
    description: 'ENDORSEMENT FROM THE HEAD OF THE INSTITUTION',
    type: 'editor',
    template: formIAContent,
  },
  {
    id: 'form-ix',
    label: 'Form IX',
    description: 'Details of equipment procured earlier under S&T/R&D funding (Form IX)',
    type: 'editor',
    template: formIXContent,
  },
  {
    id: 'form-x',
    label: 'Form X',
    description: 'Details of computers/software procured earlier under S&T/R&D funding (Form X)',
    type: 'editor',
    template: formXContent,
  },
  {
    id: 'form-xi',
    label: 'Form XI',
    description: 'Details of manpower cost (Form XI)',
    type: 'editor',
    template: formXIContent,
  },
  {
    id: 'form-xii',
    label: 'Form XII',
    description: 'Details of travel expenditure (Form XII)',
    type: 'editor',
    template: formXIIContent,
  },
];

const formIATab = TAB_DEFINITIONS.find((tab) => tab.id === 'form-ia');

const AdvancedProposalEditor = ({ 
  initialContent = '', 
  onContentChange = () => {}, 
  onWordCountChange = () => {},
  onCharacterCountChange = () => {},
  proposalTitle = 'Research Proposal',
  showStats = true,
  showExportButtons = true,
  className = '',
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [formWordCount, setFormWordCount] = useState(0);
  const [formCharacterCount, setFormCharacterCount] = useState(0);
  const [activeTab, setActiveTab] = useState(TAB_DEFINITIONS[0].id);
  const [tabContent, setTabContent] = useState(() =>
    TAB_DEFINITIONS.reduce((acc, tab) => {
      if (tab.type === 'textarea') acc[tab.id] = '';
      return acc;
    }, {})
  );

  const editorExtensions = useMemo(() => [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Underline,
      Strike,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
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
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600',
        },
      }),
      CharacterCount,
      HardBreak,
  ], []);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent || `
      <h1 style="color: black; text-align: center;">
    PROJECT PROPOSAL FOR S&T GRANT OF MoC
  </h1>

  <h2 style="color: black;">1. Project Title</h2>
  <p style="color: black;">Enter project title here.</p>

  <h2 style="color: black;">2. Principal Implementing Agency</h2>
  <p style="color: black;">Name and address of principal Implementing Agency(s)</p>

  <h2 style="color: black;">3. Project Leader / Coordinator / Principal Investigator</h2>
  <p style="color: black;">Name of Project Leader/Coordinator/Principal Investigator</p>

  <h2 style="color: black;">4. Sub-Implementing Agency</h2>
  <p style="color: black;">Name and address of Sub-Implementing Agency(s)</p>

  <h2 style="color: black;">5. Co-Investigator(s)</h2>
  <p style="color: black;">Name of Co-Investigator(s)</p>

  <h2 style="color: black;">6. Definition of the Issue (Max. 300 words)</h2>
  <p style="color: black;">Provide definition of the issue here.</p>

  <h2 style="color: black;">7. Research Objectives (2–3 Specific Objectives)</h2>
  <ul style="color: black;">
    <li>Objective 1</li>
    <li>Objective 2</li>
    <li>Objective 3</li>
      </ul>

  <h2 style="color: black;">8. Justification for Subject Area (Max. 200 words)</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">9. Benefits to the Coal Industry</h2>
  <p style="color: black;">Explain how the project is beneficial to the coal industry.</p>

  <h2 style="color: black;">10. Work Plan (Max. 100 words)</h2>
  <p style="color: black;">Provide summary of work plan here.</p>

  <h2 style="color: black;">10.1 Methodology (Max. 200 words)</h2>
  <p style="color: black;">Describe methodology here.</p>

  <h2 style="color: black;">10.2 Organization of Work Elements (Max. 200 words)</h2>
  <p style="color: black;">Describe organization of work elements here.</p>

  <h2 style="color: black;">10.3 Time Schedule & Milestones</h2>
  <p style="color: black;">Provide timeline & milestones. Add Bar Chart/PERT Chart if required.</p>

  <h2 style="color: black;">11. Proposed Outlay (Rs. in Lakhs)</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Sl. No.</th><th>Items</th><th>Total Cost</th><th>1st Year</th><th>2nd Year</th></tr>
    <tr><td></td><td>Capital Expenditure</td><td></td><td></td><td></td></tr>
    <tr><td>9.1</td><td>Land & Building</td><td></td><td></td><td></td></tr>
    <tr><td>9.2</td><td>Equipment</td><td></td><td></td><td></td></tr>
    <tr><td>9.3</td><td>Total Capital (9.1+9.2)</td><td></td><td></td><td></td></tr>
    <tr><td></td><td>Revenue Expenditure</td><td></td><td></td><td></td></tr>
    <tr><td>9.4</td><td>Salaries / Allowances</td><td></td><td></td><td></td></tr>
    <tr><td>9.5</td><td>Consumables</td><td></td><td></td><td></td></tr>
    <tr><td>9.6</td><td>Travel</td><td></td><td></td><td></td></tr>
    <tr><td>9.7</td><td>Workshop/Seminar</td><td></td><td></td><td></td></tr>
    <tr><td>9.8</td><td>Total Revenue Expenditure (9.4+9.5+9.6+9.7)</td><td></td><td></td><td></td></tr>
    <tr><td>9.9</td><td>Contingency</td><td></td><td></td><td></td></tr>
    <tr><td>9.10</td><td>Institutional Overhead</td><td></td><td></td><td></td></tr>
    <tr><td>9.11</td><td>Applicable taxes/duties/charges</td><td></td><td></td><td></td></tr>
    <tr><td>9.12</td><td>Grand Total (9.3+9.8+9.9+9.10+9.11)</td><td></td><td></td><td></td></tr>
  </table>

  <h2 style="color: black;">12. Foreign Exchange Component</h2>
  <p style="color: black;">
    Foreign Currency: <br/>
    Exchange Rate: <br/>
    Date: 
  </p>

  <h2 style="color: black;">13. Phasing of Fund Requirement (%)</h2>
  <p style="color: black;">Provide fund phasing with respect to milestones.</p>

  <h2 style="color: black;">14. Outlay for Land & Building (Rs. in Lakhs)</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Sl. No.</th><th>Item</th><th>Plinth Area</th><th>Type of Building</th><th>Estimated Cost</th></tr>
    <tr><td>1</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>2</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>Total</td><td colspan="4"></td></tr>
  </table>

  <h2 style="color: black;">15. Justification for Land & Building</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">16. Outlay for Equipment</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Equipment & Specifications</th><th>Number</th><th>Imported/Indigenous</th><th>Estimated Cost (Lakhs)</th><th>Foreign Exchange Component</th></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>Total</td><td colspan="4"></td></tr>
  </table>

  <h2 style="color: black;">17. Justification for Equipment</h2>
  <p style="color: black;">Provide justification here.</p>

  <h2 style="color: black;">18. Outlay for Consumable Materials</h2>
  <table border="1" style="width:100%; color: black; border-collapse: collapse;">
    <tr><th>Head</th><th>Particulars</th><th>1st Year</th><th>2nd Year</th><th>3rd Year</th><th>Total</th></tr>
    <tr><td>Q</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>B</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>F</td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>E</td><td></td><td></td><td></td><td></td><td></td></tr>
  </table>

  <h2 style="color: black;">19. Mandatory Proposal Components</h2>
  <ul style="color: black;">
    <li>Brief details of the organization / institution</li>
    <li>Details of infrastructural resources available including R&D setup</li>
    <li>Details of expertise, past experience, and performance</li>
    <li>R&D component under the proposed study</li>
    <li>How the project benefits the coal industry</li>
    <li>Detailed web survey report</li>
    <li>Exclusive research or development content</li>
    <li>Details of proposed collaboration / tie-up (if applicable)</li>
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
      onContentChange(editor.getHTML());
    },
  });

  const formEditor = useEditor({
    extensions: editorExtensions,
    content: formIATab?.template || '',
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setFormWordCount(words);
        setFormCharacterCount(characters);
      }
    },
  });

  const formIXEditor = useEditor({
    extensions: editorExtensions,
    content: formIXContent || '',
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setFormWordCount(words);
        setFormCharacterCount(characters);
      }
    },
  });

  const formXEditor = useEditor({
    extensions: editorExtensions,
    content: formXContent || '',
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setFormWordCount(words);
        setFormCharacterCount(characters);
      }
    },
  });

  const formXIEditor = useEditor({
    extensions: editorExtensions,
    content: formXIContent || '',
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setFormWordCount(words);
        setFormCharacterCount(characters);
      }
    },
  });

  const formXIIEditor = useEditor({
    extensions: editorExtensions,
    content: formXIIContent || '',
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (editor.storage.characterCount) {
        const words = editor.storage.characterCount.words();
        const characters = editor.storage.characterCount.characters();
        setFormWordCount(words);
        setFormCharacterCount(characters);
      }
    },
  });

  useEffect(() => {
    if (formEditor && formEditor.storage && formEditor.storage.characterCount) {
      const words = formEditor.storage.characterCount.words();
      const characters = formEditor.storage.characterCount.characters();
      setFormWordCount(words);
      setFormCharacterCount(characters);
    }
  }, [formEditor]);

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

  const handleSecondaryTabChange = (tabId, value) => {
    setTabContent((prev) => ({ ...prev, [tabId]: value }));
  };

  const getActiveRichEditor = () => {
    if (activeTab === 'form-ia') return formEditor;
    if (activeTab === 'form-ix') return formIXEditor;
    if (activeTab === 'form-x') return formXEditor;
    if (activeTab === 'form-xi') return formXIEditor;
    if (activeTab === 'form-xii') return formXIIEditor;
    return editor;
  };
  const toolbarEditor = getActiveRichEditor();

  const insertTable = () => {
    const targetEditor = getActiveRichEditor();
    targetEditor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addTableRow = () => {
    const targetEditor = getActiveRichEditor();
    targetEditor?.chain().focus().addRowAfter().run();
  };

  const deleteTableRow = () => {
    const targetEditor = getActiveRichEditor();
    targetEditor?.chain().focus().deleteRow().run();
  };

  const addTableColumn = () => {
    const targetEditor = getActiveRichEditor();
    targetEditor?.chain().focus().addColumnAfter().run();
  };

  const deleteTableColumn = () => {
    const targetEditor = getActiveRichEditor();
    targetEditor?.chain().focus().deleteColumn().run();
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const targetEditor = getActiveRichEditor();
          targetEditor?.chain().focus().setImage({ src: event.target?.result }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      const targetEditor = getActiveRichEditor();
      targetEditor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const exportAsPDF = () => {
    const targetEditor = getActiveRichEditor();
    const content = targetEditor?.getHTML();
    if (!content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.5';
    document.body.appendChild(tempDiv);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(proposalTitle, margin, yPosition);
    yPosition += 15;

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

    document.body.removeChild(tempDiv);
    pdf.save(`${proposalTitle || 'proposal'}.pdf`);
  };

  const exportAsWord = async () => {
    const targetEditor = getActiveRichEditor();
    const content = targetEditor?.getHTML();
    if (!content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const elements = [];
    const children = tempDiv.children;

    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const tagName = element.tagName.toLowerCase();
      const text = element.innerText || element.textContent;

      if (tagName.startsWith('h')) {
        const level = parseInt(tagName.charAt(1), 10);
        elements.push(
          new Paragraph({
            text,
            heading:
              level === 1
                ? HeadingLevel.HEADING_1
                : level === 2
                ? HeadingLevel.HEADING_2
                : level === 3
                ? HeadingLevel.HEADING_3
                : HeadingLevel.HEADING_4,
          })
        );
      } else if (tagName === 'p' || tagName === 'div') {
        elements.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listItems = element.querySelectorAll('li');
        listItems.forEach((item) =>
          elements.push(
            new Paragraph({
              children: [new TextRun(`• ${item.innerText || item.textContent}`)],
            })
          )
          );
      }
    }

    const doc = new Document({
      sections: [
        {
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
            new Paragraph({ text: "" }),
          ...elements,
        ],
        },
      ],
    });

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
      
        <div className="bg-orange-100 rounded-lg border border-orange-200 mb-4 overflow-hidden">
          <div className="p-2 border-b border-orange-200">
            <div className="flex flex-wrap gap-1 items-center">
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().undo().run()}
                  disabled={!toolbarEditor?.can().undo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().redo().run()}
                  disabled={!toolbarEditor?.can().redo()}
                  className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Y)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleBold().run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    toolbarEditor?.isActive('bold')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleItalic().run()}
                  className={`px-3 py-2 rounded-lg text-sm italic transition-all duration-200 ${
                    toolbarEditor?.isActive('italic')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleUnderline().run()}
                  className={`px-3 py-2 rounded-lg text-sm underline transition-all duration-200 ${
                    toolbarEditor?.isActive('underline')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleStrike().run()}
                  className={`px-3 py-2 rounded-lg text-sm line-through transition-all duration-200 ${
                    toolbarEditor?.isActive('strike')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleSuperscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('superscript')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Superscript"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleSubscript().run()}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('subscript')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Subscript"
                >
                  x₂
                </button>
              </div>

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    toolbarEditor?.isActive('heading', { level: 1 })
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    toolbarEditor?.isActive('heading', { level: 2 })
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    toolbarEditor?.isActive('heading', { level: 3 })
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Heading 3"
                >
                  H3
                </button>
              </div>

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('bulletList')
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
                  onClick={() => toolbarEditor?.chain().focus().toggleOrderedList().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('orderedList')
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

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().setTextAlign('left').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive({ textAlign: 'left' })
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
                  onClick={() => toolbarEditor?.chain().focus().setTextAlign('center').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive({ textAlign: 'center' })
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
                  onClick={() => toolbarEditor?.chain().focus().setTextAlign('right').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive({ textAlign: 'right' })
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
                  onClick={() => toolbarEditor?.chain().focus().setTextAlign('justify').run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive({ textAlign: 'justify' })
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

              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('blockquote')
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
                  onClick={() => toolbarEditor?.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('codeBlock')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Code Block"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().toggleCode().run()}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    toolbarEditor?.isActive('code')
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-black hover:bg-orange-100 border border-orange-200'
                  }`}
                  title="Inline Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => toolbarEditor?.chain().focus().setHardBreak().run()}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Line Break"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertTable}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Table"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0M8 21V7M16 21V7M3 11h18M3 15h18"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addTableRow}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Add Table Row"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={deleteTableColumn}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Delete Table Column"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex gap-1 items-center border-r border-orange-300 pr-3 mr-3">
                <button
                  type="button"
                  onClick={insertImage}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="p-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200"
                  title="Insert Link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </button>
              </div>

              {showExportButtons && (
                <div className="flex gap-1 items-center">
                  <button
                    type="button"
                    onClick={exportAsPDF}
                    className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-orange-100 border border-orange-200 transition-all duration-200 flex items-center gap-2"
                    title="Export as PDF"
                  >
                    <svg className="w-5 h-5" fill="black" stroke="none" viewBox="0 0 24 24">
                      <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z" />
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 16.5L8 11h1.5l1 3.5L12 11h1.5l-1.5 5.5H10.5l-.5-2-.5 2H9.5zM14 9V4l5 5h-4z" />
                    </svg>
                    DOC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none">
          <div className="border border-gray-200 rounded-xl min-h-[600px] p-4 bg-white shadow-inner">
            {/* Tab Bar */}
            <div className="flex flex-wrap gap-2 mb-4">
              {TAB_DEFINITIONS.map((tab) => (
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

            <div className="rounded-xl p-4 bg-white border border-gray-100 min-h-[420px]">
              {(() => {
                const currentTab = TAB_DEFINITIONS.find((tab) => tab.id === activeTab);
                if (!currentTab) return null;

                if (currentTab.type === 'editor') {
                  const activeEditorInstance = getActiveRichEditor();
                  return (
                    <EditorContent
                      editor={activeEditorInstance}
                      className="focus:outline-none min-h-[380px] text-black leading-relaxed"
                    />
                  );
                }

                if (currentTab.type === 'static') {
                  return (
                    <div
                      className="min-h-[360px] border border-gray-200 rounded-md"
                      style={{ overflowY: 'auto' }}
                      dangerouslySetInnerHTML={{ __html: currentTab.template }}
                    />
                  );
                }

                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-black">{currentTab.label}</p>
                        <p className="text-xs text-gray-500">{currentTab.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {tabContent[activeTab]?.length || 0} chars
                      </span>
                    </div>
                    <textarea
                      value={tabContent[activeTab]}
                      onChange={(e) => handleSecondaryTabChange(activeTab, e.target.value)}
                      placeholder={currentTab.placeholder}
                      className="w-full min-h-[360px] p-3 border border-gray-200 rounded-md text-sm text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {showStats && (
          <div className="mt-8 space-y-6">
            <div className="pt-4 border-t border-orange-200">
              <div className="flex justify-between items-start">
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
                <div className="text-right">
                  <div className="text-sm text-black">Last saved: {new Date().toLocaleTimeString()}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Document will be auto-saved
                  </div>
                </div>
              </div>
            </div>
            
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

