/**
 * Utility to clear proposal localStorage
 * 
 * This can be used to clear old/corrupted proposal data from localStorage
 * Run in browser console: window.clearProposalStorage()
 */

export const clearProposalStorage = () => {
  try {
    const keysToRemove = [];
    
    // Find all proposal-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('proposal_draft_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all proposal keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    });
    
    console.log(`✅ Cleared ${keysToRemove.length} proposal draft(s) from localStorage`);
    return keysToRemove.length;
  } catch (error) {
    console.error('Error clearing proposal storage:', error);
    return 0;
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.clearProposalStorage = clearProposalStorage;
}

export default clearProposalStorage;
