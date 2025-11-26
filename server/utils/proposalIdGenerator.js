import Proposal from '../models/Proposal.js';

class ProposalIDGenerator {
  /**
   * Generate a unique, human-readable proposal code
   * Format: PROP-YYYY-NNNN (e.g., PROP-2025-0001)
   */
  async generateProposalCode() {
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}`;

    // Find the latest proposal code for this year
    const latestProposal = await Proposal.findOne({
      proposalCode: new RegExp(`^${prefix}-`)
    }).sort({ proposalCode: -1 });

    let sequence = 1;
    if (latestProposal) {
      const lastCode = latestProposal.proposalCode;
      const lastSequence = parseInt(lastCode.split('-')[2]);
      sequence = lastSequence + 1;
    }

    // Format sequence with leading zeros (4 digits)
    const sequenceStr = sequence.toString().padStart(4, '0');
    return `${prefix}-${sequenceStr}`;
  }

  /**
   * Validate proposal code format
   */
  isValidProposalCode(code) {
    const pattern = /^PROP-\d{4}-\d{4}$/;
    return pattern.test(code);
  }
}

export default new ProposalIDGenerator();
