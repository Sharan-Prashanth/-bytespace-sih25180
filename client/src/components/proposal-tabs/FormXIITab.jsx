/**
 * FormXIITab - Travel Expenditure Details
 * This component contains Form XII content for travel and daily allowance details
 * Converted from TipTap to Plate.js format
 */

export const formXIITabConfig = {
  id: 'form-xii',
  label: 'Form XII',
  description: 'Details of travel expenditure (Form XII)',
  type: 'editor',
};

export const formXIIDefaultContent = [
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'FORM – XII' }],
  },
  {
    type: 'h2',
    align: 'center',
    children: [{ text: 'DETAILS OF TRAVEL EXPENDITURE (TA/DA)' }],
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
          { type: 'th', width: '6%', children: [{ type: 'p', children: [{ text: 'Designation' }] }] },
          { type: 'th', width: '10%', children: [{ type: 'p', children: [{ text: 'From (Place To Place)' }] }] },
          { type: 'th', width: '11%', children: [{ type: 'p', children: [{ text: 'Approx. Distance, In Km' }] }] },
          { type: 'th', width: '9%', children: [{ type: 'p', children: [{ text: 'Mode' }] }] },
          { type: 'th', width: '7%', children: [{ type: 'p', children: [{ text: 'Fare, InRs..' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'No. of Trips' }] }] },
          { type: 'th', width: '8%', children: [{ type: 'p', children: [{ text: 'Total travel Expenses (5 X 6), InRs.' }] }] },
          { type: 'th', width: '13%', children: [{ type: 'p', children: [{ text: 'No. of days Involved for Daily Allowance (DA), InRs.' }] }] },
          { type: 'th', width: '9%', children: [{ type: 'p', children: [{ text: 'Rate of DA per day, InRs.' }] }] },
          { type: 'th', width: '10%', children: [{ type: 'p', children: [{ text: 'Total DA (8 x 9), InRs.' }] }] },
          { type: 'th', width: '9%', children: [{ type: 'p', children: [{ text: 'Total TA+DA (7+10), InRs.' }] }] },
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
          { type: 'th', children: [{ type: 'p', children: [{ text: '7' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '8' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '9' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '10' }] }] },
          { type: 'th', children: [{ type: 'p', children: [{ text: '11' }] }] },
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
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
        ],
      },
    ],
  },
  {
    type: 'p',
    children: [{ text: 'NB:' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    indent: 1,
    children: [
      { text: '• The form should be jointly signed by Project Leader/Coordinator and Associated Finance Officer of the Principal Implementing Agency(s)/Sub-implementing Agency(s) and to be incorporated in the project proposal.' },
    ],
  },
];

export default {
  config: formXIITabConfig,
  defaultContent: formXIIDefaultContent,
};
