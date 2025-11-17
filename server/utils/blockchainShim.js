// Lightweight shim to replace blockchain client functions when the blockchain
// workspace is unavailable or intentionally disabled. These functions are
// no-ops that return safe defaults so the server can run without crashing.

export async function computeFileHash(filePath) {
  // Return a deterministic placeholder hash so callers can continue.
  return '0x' + '0'.repeat(64);
}

export async function uploadFileToIPFS(filePath) {
  // IPFS upload disabled in shim — return empty CID.
  return '';
}

export async function storeOnChain(proposalId, cid, fileHash, note) {
  // Return a fake receipt object to satisfy code that expects a tx receipt.
  return { transactionHash: null, mock: true };
}

export async function storeDraftVersionOnChain(proposalId, cid, fileHash, parentHash, versionNumber, metadata) {
  return { transactionHash: null, mock: true };
}

export async function getRecordsByProposal(proposalId) {
  return [];
}

export async function getRecord(index) {
  return null;
}

export async function getRecordCount() {
  return 0;
}
