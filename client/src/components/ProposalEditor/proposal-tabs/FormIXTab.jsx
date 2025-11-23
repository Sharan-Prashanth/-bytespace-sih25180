/**
 * FormIXTab - Equipment Details
 * This component contains Form IX content for equipment procurement details
 * Converted from TipTap to Plate.js format
 */

export const formIXTabConfig = {
  id: 'formix',
  label: 'Form IX',
  description: 'Details of equipment procured earlier under S&T/R&D funding (Form IX)',
  type: 'editor',
};

export const formIXDefaultContent = [
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'FORM – IX' }],
  },
  {
    type: 'p',
    children: [{ text: 'Details of Equipment other than Computer Hardware / Software already procured under S&T Scheme of Ministry of Coal / R&D fund of CIL in the past - which are related to the below mentioned S&T project', bold: true }],
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
    children: [{ text: 'Equipment Details' }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'tr',
        children: [
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'Sl.No' }] }] },
          { type: 'th', width: '18%', children: [{ type: 'p', children: [{ text: 'Details of Equipment' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'No. of Sets' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'Make & Model' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'Year of Procurement' }] }] },
          { type: 'th', width: '19%', children: [{ type: 'p', children: [{ text: 'Name of the S&T/R&D Project against which procured' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'Status of equipment' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'Remark' }] }] },
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
      { text: '(i) A list of all equipment procured for the last seven years from S&T/R&D ' },
      { text: 'Fund', bold: true, italic: true },
      { text: ' giving the status and its present utilisation.' },
    ],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '(ii) The status should cover whether the equipment is in working condition or under breakdown. If under breakdown, can it be repaired & used in this research project?' },
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
  config: formIXTabConfig,
  defaultContent: formIXDefaultContent,
};
