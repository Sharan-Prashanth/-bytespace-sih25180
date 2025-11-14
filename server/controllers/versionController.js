import { saveDraftVersion, getVersionHistory } from '../services/versionService.js';
import Proposal from '../models/Proposal.js';

export const saveDraft = async (req, res) => {
  try {
    const { proposalId, content, note } = req.body;
    if (!proposalId || !content) {
      return res.status(400).json({ success: false, message: 'proposalId and content are required' });
    }

    // Optional: verify proposal exists and user owns it
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const result = await saveDraftVersion({ proposalId, content, note, user: req.user });
    if (result.duplicate) {
      return res.status(409).json({ success: false, message: result.message });
    }
    if (result.plagiarism) {
      // Flag proposal - business logic placeholder
      return res.status(403).json({ success: false, message: result.message });
    }

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to save draft version' });
    }

    res.json({ success: true, receipt: result.receipt, fileHash: result.fileHash, cid: result.cid, versionNumber: result.versionNumber });
  } catch (err) {
    console.error('saveDraft error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const history = async (req, res) => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId required' });

    const history = await getVersionHistory(Number(proposalId));
    res.json({ success: true, history });
  } catch (err) {
    console.error('history error:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
};
