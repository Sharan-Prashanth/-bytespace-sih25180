/**
 * FormXITab - Manpower Cost Details
 * This component contains Form XI content for manpower cost and salary details
 * Converted from TipTap to Plate.js format
 */

export const formXITabConfig = {
  id: 'form-xi',
  label: 'Form XI',
  description: 'Details of manpower cost (Form XI)',
  type: 'editor',
};

export const formXIDefaultContent = [
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'FORM – XI' }],
  },
  {
    type: 'h2',
    align: 'center',
    children: [{ text: 'DETAILS OF MANPOWER COST (SALARY AND WAGES)' }],
  },
  {
    type: 'p',
    children: [{ text: 'Name of the Project:', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: 'Project Code:', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: 'Principal Implementing Agency(s):', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: 'Sub Implementing Agency(s):', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          { type: 'th', width: '6%', children: [{ type: 'p', children: [{ text: 'Sl. No.' }] }] },
          { type: 'th', width: '12%', children: [{ type: 'p', children: [{ text: 'Designation' }] }] },
          { type: 'th', width: '10%', children: [{ type: 'p', children: [{ text: 'No. of Persons' }] }] },
          { type: 'th', width: '14%', children: [{ type: 'p', children: [{ text: 'Total No. of months required/persons' }] }] },
          { type: 'th', width: '12%', children: [{ type: 'p', children: [{ text: 'Salary/month, InRs.' }] }] },
          { type: 'th', width: '14%', children: [{ type: 'p', children: [{ text: 'Total salary (3 x 4 x 5), InRs.' }] }] },
          { type: 'th', width: '32%', colSpan: 3, children: [{ type: 'p', children: [{ text: 'Year-wise phasing, InRs.' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'th', children: [{ type: 'p', children: [{ text: '1' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '2' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '3' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '4' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '5' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '6' }] }] },
          { type: 'th', width: '10.67%', children: [{ type: 'p', children: [{ text: '1st Yr.' }] }] },
          { type: 'th', width: '10.67%', children: [{ type: 'p', children: [{ text: '2nd Yr.' }] }] },
          { type: 'th', width: '10.66%', children: [{ type: 'p', children: [{ text: '3rd Yr.' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
      {
        type: 'tr',
        children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: 'Note:' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '• Engagement of the personnel (Research Associate/Research Assistant/Research Fellow/JRF/SRF) for implementation of the project shall be the responsibility of the Principal Implementing or Sub-implementing Agency(s) as the case may be. The payment to be made to the engaged personnel for the desired duration of the project shall be within the relevant Norms/Guidelines of the concerned related Principal Implementing or Sub-implementing Agency(s).' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '• Salaries of permanent employees of the Principal Implementing / Sub-implementing Agency(s) are not admissible' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '• The form should be jointly signed by Project Leader/Coordinator and Associated Finance Officer of the Principal Implementing /Sub-implementing Agency(s) and to be incorporated in the project proposal.' },
    ],
  },
];

export default {
  config: formXITabConfig,
  defaultContent: formXIDefaultContent,
};
