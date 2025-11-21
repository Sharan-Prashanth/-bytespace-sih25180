/**
 * FormIATab - Endorsement from Head of Institution
 * This component contains Form IA content for institutional endorsement
 * Converted from TipTap to Plate.js format
 */

export const formIATabConfig = {
  id: 'form-ia',
  label: 'Form IA',
  description: 'ENDORSEMENT FROM THE HEAD OF THE INSTITUTION',
  type: 'editor',
};

export const formIADefaultContent = [
  {
    type: 'h1',
    align: 'center',
    children: [{ text: 'FORM – IA' }],
  },
  {
    type: 'h2',
    align: 'center',
    children: [{ text: 'ENDORSEMENT FROM' }],
  },
  {
    type: 'h2',
    align: 'center',
    children: [{ text: 'THE HEAD OF THE INSTITUTION' }],
  },
  {
    type: 'p',
    align: 'center',
    children: [{ text: '(To be given on the letter head)', italic: true }],
  },
  {
    type: 'p',
    children: [{ text: 'Project Title:', bold: true }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'ol',
    children: [
      {
        type: 'li',
        children: [
          {
            type: 'lic',
            children: [
              { text: 'Certified that the Company/Institute intends to undertake above project with Dr/Sri/Smt ', bold: true },
              { text: '..........................................................' },
              { text: ' as a Project Leader/Coordinator/Principal Investigator of the project.', bold: true },
            ],
          },
        ],
      },
      {
        type: 'li',
        children: [
          {
            type: 'lic',
            children: [
              { text: 'Certified that necessary infrastructure facilities shall be made available to Project Team.', bold: true },
            ],
          },
          {
            type: 'p',
            children: [
              { text: 'Accommodation, transport, manpower etc. will be provided at the project site to the research team for undertaking the field work.' },
            ],
          },
        ],
      },
      {
        type: 'li',
        children: [
          {
            type: 'lic',
            children: [
              { text: 'Certified that equipment proposed to be procured from the S&T Grant are not readily available in the Company/Institute for the purpose.', bold: true },
            ],
          },
        ],
      },
      {
        type: 'li',
        children: [
          {
            type: 'lic',
            children: [
              { text: 'The company/Institute assumes to undertake the financial and other management responsibilities of the project.', bold: true },
            ],
          },
        ],
      },
    ],
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
    type: 'p',
    align: 'right',
    children: [{ text: 'Name and signature' }],
  },
  {
    type: 'p',
    align: 'right',
    children: [{ text: 'of Head of the Company/Institution' }],
  },
  {
    type: 'p',
    align: 'right',
    children: [{ text: '(With seal)', italic: true }],
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
    type: 'p',
    children: [{ text: 'Date:' }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
  {
    type: 'p',
    children: [{ text: 'Place:' }],
  },
];

export default {
  config: formIATabConfig,
  defaultContent: formIADefaultContent,
};
