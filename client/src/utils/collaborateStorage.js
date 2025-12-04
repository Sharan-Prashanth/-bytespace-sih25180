/**
 * CollaborateStorage - Local storage management for collaborate page
 * Handles auto-save and persistence of proposal data during collaboration
 */

const STORAGE_KEY_PREFIX = 'collaborate_proposal_';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

class CollaborateStorage {
  constructor(proposalCode) {
    this.proposalCode = proposalCode;
    this.storageKey = `${STORAGE_KEY_PREFIX}${proposalCode}`;
    this.isDirty = false;
    this.lastSavedAt = null;
  }

  /**
   * Initialize storage and load existing data
   */
  initialize() {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.lastSavedAt = data.lastSavedAt ? new Date(data.lastSavedAt) : null;
        return data;
      }
    } catch (error) {
      console.error('[CollaborateStorage] Error loading from localStorage:', error);
    }
    return null;
  }

  /**
   * Save data to localStorage
   */
  save(data, markDirty = true) {
    if (typeof window === 'undefined') return null;

    try {
      const saveData = {
        ...data,
        proposalCode: this.proposalCode,
        lastSavedAt: new Date().toISOString(),
        savedVersion: data.currentVersion || 0.1
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      this.lastSavedAt = new Date();
      
      if (!markDirty) {
        this.isDirty = false;
      }

      return saveData;
    } catch (error) {
      console.error('[CollaborateStorage] Error saving to localStorage:', error);
      return null;
    }
  }

  /**
   * Mark data as dirty (has unsaved changes)
   */
  markDirty() {
    this.isDirty = true;
  }

  /**
   * Clear dirty flag
   */
  clearDirty() {
    this.isDirty = false;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges() {
    return this.isDirty;
  }

  /**
   * Get last saved timestamp
   */
  getLastSavedTime() {
    return this.lastSavedAt;
  }

  /**
   * Get stored data
   */
  getData() {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[CollaborateStorage] Error getting data:', error);
      return null;
    }
  }

  /**
   * Update specific form content
   */
  updateFormContent(formId, content) {
    const data = this.getData() || {};
    
    if (!data.forms) {
      data.forms = {};
    }

    data.forms[formId] = {
      ...data.forms[formId],
      ...content,
      lastModifiedAt: new Date().toISOString()
    };

    this.save(data);
    this.markDirty();
  }

  /**
   * Update proposal info
   */
  updateProposalInfo(proposalInfo) {
    const data = this.getData() || {};
    data.proposalInfo = proposalInfo;
    this.save(data);
    this.markDirty();
  }

  /**
   * Clear stored data
   */
  clear() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.storageKey);
      this.isDirty = false;
      this.lastSavedAt = null;
    } catch (error) {
      console.error('[CollaborateStorage] Error clearing storage:', error);
    }
  }

  /**
   * Sync local data with server data
   * Returns merged data preferring server data for conflicts
   */
  syncWithServerData(serverData) {
    const localData = this.getData();

    if (!localData) {
      // No local data, use server data
      this.save(serverData, false);
      return serverData;
    }

    // Compare timestamps
    const localTime = new Date(localData.lastSavedAt || 0).getTime();
    const serverTime = new Date(serverData.updatedAt || 0).getTime();

    if (serverTime >= localTime) {
      // Server is newer or equal, use server data
      this.save(serverData, false);
      return serverData;
    }

    // Local is newer, merge carefully (server wins for version, local wins for content)
    const merged = {
      ...serverData,
      forms: {
        ...serverData.forms,
        ...localData.forms
      },
      proposalInfo: localData.proposalInfo || serverData.proposalInfo
    };

    this.save(merged, true);
    return merged;
  }
}

/**
 * Get storage instance for a proposal
 */
export const getCollaborateStorage = (proposalCode) => {
  return new CollaborateStorage(proposalCode);
};

/**
 * Clear all collaborate storage data
 */
export const clearAllCollaborateStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('[CollaborateStorage] Error clearing all storage:', error);
  }
};

export default CollaborateStorage;
