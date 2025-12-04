/**
 * Proposal Storage Utility
 * Manages local storage for proposal drafts with version tracking
 * 
 * Storage Structure:
 * {
 *   proposalId: string,
 *   proposalCode: string,
 *   currentVersion: number (e.g., 0.1, 0.2, ...),
 *   lastSavedAt: timestamp,
 *   proposalInfo: {...},
 *   initialDocuments: {...},
 *   formIContent: {...},
 *   additionalForms: {...},
 *   supportingDocuments: {...},
 *   isDirty: boolean // indicates unsaved changes
 * }
 */

const STORAGE_KEY_PREFIX = 'proposal_draft_';
const STORAGE_VERSION = '1.0';

class ProposalStorage {
  constructor() {
    this.storageKey = null;
    this.data = null;
  }

  /**
   * Initialize storage for a proposal
   * @param {string} proposalId - MongoDB proposal ID or 'new' for new proposal
   */
  initialize(proposalId = 'new') {
    this.storageKey = `${STORAGE_KEY_PREFIX}${proposalId}`;
    this.data = this.load();
    
    if (!this.data) {
      this.data = this.createEmptyProposal(proposalId);
    }
    
    return this.data;
  }

  /**
   * Create empty proposal structure
   */
  createEmptyProposal(proposalId) {
    return {
      storageVersion: STORAGE_VERSION,
      proposalId: proposalId,
      proposalCode: null,
      currentVersion: 0.1,
      lastSavedAt: null,
      proposalInfo: {
        title: '',
        fundingMethod: 'S&T of MoC',
        principalImplementingAgency: '',
        subImplementingAgency: '',
        projectLeader: '',
        projectCoordinator: '',
        projectDurationMonths: '',
        projectOutlayLakhs: '',
      },
      initialDocuments: {
        coveringLetter: null,
        cv: null,
      },
      formIContent: null,
      additionalForms: {
        formia: null,
        formix: null,
        formx: null,
        formxi: null,
        formxii: null,
      },
      supportingDocuments: {
        orgDetails: null,
        infrastructure: null,
        expertise: null,
        rdComponent: null,
        benefits: null,
        webSurvey: null,
        researchContent: null,
        collaboration: null,
      },
      isDirty: false
    };
  }

  /**
   * Load proposal from localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Version migration if needed
      if (data.storageVersion !== STORAGE_VERSION) {
        return this.migrate(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error loading proposal from storage:', error);
      return null;
    }
  }

  /**
   * Save proposal to localStorage
   * @param {object} updates - Partial updates to merge
   * @param {boolean} incrementVersion - Whether to increment minor version
   */
  save(updates = {}, incrementVersion = false) {
    try {
      // Merge updates
      this.data = {
        ...this.data,
        ...updates,
        lastSavedAt: Date.now(),
        isDirty: false
      };

      // Increment version if requested
      if (incrementVersion) {
        this.data.currentVersion = this.incrementVersion(this.data.currentVersion);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      return this.data;
    } catch (error) {
      console.error('Error saving proposal to storage:', error);
      throw error;
    }
  }

  /**
   * Mark proposal as dirty (has unsaved changes)
   */
  markDirty() {
    if (this.data) {
      this.data.isDirty = true;
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
  }

  /**
   * Increment version number (0.1 -> 0.2 -> ... -> 0.9 -> 0.10 -> 0.11)
   */
  incrementVersion(currentVersion) {
    // For draft versions, always keep major version as 0
    const parts = currentVersion.toString().split('.');
    const minor = parseInt(parts[1]) || 0;
    return parseFloat(`0.${minor + 1}`);
  }

  /**
   * Update proposal info
   */
  updateProposalInfo(proposalInfo) {
    return this.save({ proposalInfo }, false);
  }

  /**
   * Update initial documents
   */
  updateInitialDocuments(initialDocuments) {
    return this.save({ initialDocuments }, false);
  }

  /**
   * Update Form I content
   */
  updateFormIContent(formIContent) {
    return this.save({ formIContent }, false);
  }

  /**
   * Update additional forms
   */
  updateAdditionalForms(additionalForms) {
    return this.save({ additionalForms }, false);
  }

  /**
   * Update supporting documents
   */
  updateSupportingDocuments(supportingDocuments) {
    return this.save({ supportingDocuments }, false);
  }

  /**
   * Update proposal ID and code (after creation in DB)
   */
  updateProposalMeta(proposalId, proposalCode) {
    // Ensure data exists - initialize if not
    if (!this.data) {
      this.initialize(proposalId);
    }
    
    const oldKey = this.storageKey;
    
    // Update internal data
    this.data.proposalId = proposalId;
    this.data.proposalCode = proposalCode;
    
    // Update storage key
    this.storageKey = `${STORAGE_KEY_PREFIX}${proposalId}`;
    
    // Save to new key
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    
    // Remove old key if different
    if (oldKey !== this.storageKey) {
      localStorage.removeItem(oldKey);
    }
    
    return this.data;
  }

  /**
   * Get current data
   */
  getData() {
    return this.data;
  }

  /**
   * Check if there are unsaved changes
   */
  isDirty() {
    return this.data?.isDirty || false;
  }

  /**
   * Clear proposal from storage
   */
  clear() {
    if (this.storageKey) {
      localStorage.removeItem(this.storageKey);
    }
    this.data = null;
    this.storageKey = null;
  }

  /**
   * Migrate data from old version
   */
  migrate(oldData) {
    // Add migration logic if storage structure changes
    const migratedData = {
      ...this.createEmptyProposal(oldData.proposalId),
      ...oldData,
      storageVersion: STORAGE_VERSION
    };
    
    // Fix old fundingMethod enum values
    if (migratedData.proposalInfo?.fundingMethod) {
      const mapping = {
        'S&T_OF_MOC': 'S&T of MoC',
        'R&D_OF_CIL': 'R&D of CIL'
      };
      if (mapping[migratedData.proposalInfo.fundingMethod]) {
        migratedData.proposalInfo.fundingMethod = mapping[migratedData.proposalInfo.fundingMethod];
      }
    }
    
    return migratedData;
  }

  /**
   * Get all stored proposal IDs
   */
  static getAllStoredProposals() {
    const proposals = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          proposals.push({
            proposalId: data.proposalId,
            proposalCode: data.proposalCode,
            title: data.proposalInfo?.title,
            lastSavedAt: data.lastSavedAt,
            currentVersion: data.currentVersion
          });
        } catch (error) {
          console.error('Error parsing stored proposal:', error);
        }
      }
    }
    return proposals;
  }

  /**
   * Clear all stored proposals
   */
  static clearAll() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export default ProposalStorage;
