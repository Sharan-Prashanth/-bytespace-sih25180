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
import formITab from './FormITab';
import formIATab from './FormIATab';
import formIXTab from './FormIXTab';
import formXTab from './FormXTab';
import formXITab from './FormXITab';
import formXIITab from './FormXIITab';

// Export individual tabs
export { formITab, formIATab, formIXTab, formXTab, formXITab, formXIITab };

// Export tab configurations for easy access
export const TAB_CONFIGS = [
  formITab.config,
  formIATab.config,
  formIXTab.config,
  formXTab.config,
  formXITab.config,
  formXIITab.config,
];

// Export default content for all tabs
export const TAB_DEFAULT_CONTENT = {
  'formi': formITab.defaultContent,
  'formia': formIATab.defaultContent,
  'formix': formIXTab.defaultContent,
  'formx': formXTab.defaultContent,
  'formxi': formXITab.defaultContent,
  'formxii': formXIITab.defaultContent,
};

// Default export with all tabs
export default {
  tabs: {
    formITab,
    formIATab,
    formIXTab,
    formXTab,
    formXITab,
    formXIITab,
  },
  configs: TAB_CONFIGS,
  defaultContent: TAB_DEFAULT_CONTENT,
};
