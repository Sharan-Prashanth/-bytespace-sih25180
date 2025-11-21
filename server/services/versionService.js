import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  uploadFileToIPFS,
  computeFileHash,
  storeDraftVersionOnChain,
  getRecordsByProposal,
  getRecord,
  getRecordCount
} from '../utils/blockchainShim.js';

// Save draft version: compute hash, duplicate-detect, upload and store on-chain
export async function saveDraftVersion({ proposalId, content, note = 'Draft Version', uploadToIpfs = true, user = {} }) {
  // Prepare tmp file
  const tmpDir = path.join(process.cwd(), 'blockchain', 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const fileName = `${proposalId}-${Date.now()}.json`;
  const tmpPath = path.join(tmpDir, fileName);

  const payload = {
    proposalId,
    content,
    note,
    savedBy: user.name || user.email || user._id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2));

  // Compute hash (uses existing helper which reads file)
  const fileHash = await computeFileHash(tmpPath); // returns 0x....

  // Duplicate detection across all records
  try {
    const total = Number(await getRecordCount());
    for (let i = 0; i < total; i++) {
      const rec = await getRecord(i);
      // rec.fileHash is bytes32
      if (!rec) continue;
      const existingHash = rec.fileHash;
      if (!existingHash) continue;
      if (existingHash.toLowerCase() === fileHash.toLowerCase()) {
        const existingProposalId = Number(rec.proposalId);
        if (existingProposalId === Number(proposalId)) {
          // Duplicate for same proposal
          try { fs.unlinkSync(tmpPath); } catch (e) {}
          return { duplicate: true, message: 'Duplicate version detected. Please modify content before saving.' };
        } else {
          // Duplicate across different proposal => potential plagiarism
          try { fs.unlinkSync(tmpPath); } catch (e) {}
          return { plagiarism: true, message: 'Duplicate content detected across proposals. Flagged for review.' };
        }
      }
    }
  } catch (err) {
    console.error('Error during duplicate detection:', err);
    // continue — do not block saving if detection fails
  }

  // Determine parentHash and versionNumber
  let parentHash = '0x' + '0'.repeat(64);
  let versionNumber = 1;
  try {
    const indexes = await getRecordsByProposal(Number(proposalId));
    if (indexes && indexes.length > 0) {
      const lastIndex = Number(indexes[indexes.length - 1]);
      const lastRec = await getRecord(lastIndex);
      if (lastRec && lastRec.fileHash) {
        parentHash = lastRec.fileHash;
        // if lastRec.versionNumber exists, use +1, else infer 1+length
        versionNumber = Number(lastRec.versionNumber || indexes.length) + 1;
      }
    }
  } catch (err) {
    console.error('Error getting parent version info:', err);
  }

  // Optionally upload to IPFS
  let cid = '';
  if (uploadToIpfs) {
    try {
      cid = await uploadFileToIPFS(tmpPath);
    } catch (err) {
      console.error('IPFS upload failed:', err);
      // continue without CID
      cid = '';
    }
  }

  // Store on-chain via new helper
  try {
    const receipt = await storeDraftVersionOnChain(Number(proposalId), cid, fileHash, parentHash, versionNumber, note);
    try { fs.unlinkSync(tmpPath); } catch (e) {}
    return { success: true, receipt, fileHash, cid, versionNumber };
  } catch (err) {
    console.error('Failed to store draft on-chain:', err);
    try { fs.unlinkSync(tmpPath); } catch (e) {}
    return { success: false, error: String(err) };
  }
}

export async function getVersionHistory(proposalId) {
  const result = [];
  try {
    const indexes = await getRecordsByProposal(Number(proposalId));
    for (let idx of indexes) {
      const rec = await getRecord(Number(idx));
      result.push(rec);
    }
  } catch (err) {
    console.error('Error fetching version history:', err);
  }
  return result;
}
