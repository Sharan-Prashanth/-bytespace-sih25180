/**
 * FormXTab - Computer/Software Details
 * This component contains Form X content for computer and software procurement details
 * Converted from TipTap to Plate.js format
 */

export const formXTabConfig = {
  id: 'formx',
  label: 'Form X',
  description: 'Details of computers/software procured earlier under S&T/R&D funding (Form X)',
  type: 'editor',
};

export const formXDefaultContent = [
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'FORM – X' }],
  },
  {
    type: 'p',
    children: [{ text: 'Details of Computers, Software and accessories already procured under S&T Scheme of Ministry of Coal / R&D fund of CIL in the past - which are related to the below mentioned S&T project', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
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
    type: 'h2',
    children: [{ text: 'Computer / Software Details' }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'Sl.No' }] }] },
          { type: 'th', width: '18%', children: [{ type: 'p', children: [{ text: 'Details of Computers/software' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'No. of Sets' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'Make & Model' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'Year of Procurement' }] }] },
          { type: 'th', width: '17%', children: [{ type: 'p', children: [{ text: 'Name of the S&T/R&D Project against which procured' }] }] },
          { type: 'th', width: '15%', children: [{ type: 'p', children: [{ text: 'Present condition of the equipment/instrument' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'Remarks' }] }] },
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
      { text: '(i) A list of all computer & accessories procured for the last three years from S&T/R&D ' },
      { text: 'Fund', bold: true, italic: true },
      { text: ' giving the status and its present utilisation.' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '(ii) The status should cover whether the computer & accessories are in working condition or under breakdown. If under breakdown, can it be repaired & used in this research project?' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '(iii) In the light of the above please give detailed justification for procurement of additional equipment when such equipment had been procured earlier under other S&T/R&D funding.' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '(iv) This form should be signed by Project Leader and Project Coordinator and to be incorporated in the project proposal.' },
    ],
  },
];

export default {
  config: formXTabConfig,
  defaultContent: formXDefaultContent,
};
