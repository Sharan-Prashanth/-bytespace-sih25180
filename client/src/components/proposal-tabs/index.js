/**
 * Proposal Tabs - Modularized Components
 * 
 * This index file exports all proposal tab components for easy imports.
 * Each tab has been extracted from the original AdvancedProposalEditor.jsx
 * and is now ready to be converted to Plate.js format.
 * 
 * Usage:
 * import { mainProposalTab, formIATab, formIXTab } from '@/components/proposal-tabs';
 * 
 * Or import individual tabs:
 * import mainProposalTab from '@/components/proposal-tabs/MainProposalTab';
 */

// Import all tab components
import mainProposalTab from './MainProposalTab';
import formIATab from './FormIATab';
import formIXTab from './FormIXTab';
import formXTab from './FormXTab';
import formXITab from './FormXITab';
import formXIITab from './FormXIITab';

// Export individual tabs
export { mainProposalTab, formIATab, formIXTab, formXTab, formXITab, formXIITab };

// Export tab configurations for easy access
export const TAB_CONFIGS = [
  mainProposalTab.config,
  formIATab.config,
  formIXTab.config,
  formXTab.config,
  formXITab.config,
  formXIITab.config,
];

// Export default content for all tabs
export const TAB_DEFAULT_CONTENT = {
  main: mainProposalTab.defaultContent,
  'form-ia': formIATab.defaultContent,
  'form-ix': formIXTab.defaultContent,
  'form-x': formXTab.defaultContent,
  'form-xi': formXITab.defaultContent,
  'form-xii': formXIITab.defaultContent,
};

// Default export with all tabs
export default {
  tabs: {
    mainProposalTab,
    formIATab,
    formIXTab,
    formXTab,
    formXITab,
    formXIITab,
  },
  configs: TAB_CONFIGS,
  defaultContent: TAB_DEFAULT_CONTENT,
};
