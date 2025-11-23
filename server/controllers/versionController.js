import { createVersion, getVersionHistory } from '../services/versionService.js';
import Proposal from '../models/Proposal.js';

export const saveDraft = async (req, res) => {
  try {
    const { proposalId, formId, content, note } = req.body;
    if (!proposalId || !formId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'proposalId, formId, and content are required' 
      });
    }

    // Verify proposal exists and user owns it
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Get old content for diff calculation
    const oldContent = proposal.forms?.find(f => f.formId === formId)?.content || {};

    // Create version using the version service
    const version = await createVersion({
      proposalId,
      formId,
      oldJSON: oldContent,
      newJSON: content,
      userId: req.user._id,
      changeType: 'draft_save',
      comment: note || 'Draft saved'
    });

    if (!version) {
      return res.status(400).json({ 
        success: false, 
        message: 'No changes detected' 
      });
    }

    res.json({ 
      success: true, 
      versionNumber: version.versionNumber,
      versionType: version.versionType
    });
  } catch (err) {
    console.error('saveDraft error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const history = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { formId } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    if (!proposalId) {
      return res.status(400).json({ success: false, message: 'proposalId required' });
    }
    if (!formId) {
      return res.status(400).json({ success: false, message: 'formId required' });
    }

    const history = await getVersionHistory(proposalId, formId, limit, skip);
    res.json({ success: true, history });
  } catch (err) {
    console.error('history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
