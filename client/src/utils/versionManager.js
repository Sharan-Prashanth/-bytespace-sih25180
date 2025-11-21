// Simple IndexedDB-backed version manager for client-side version storage.
// Stores per-proposal versions in an object store. Each version has metadata
// { versionNumber, hash, timestamp } and the file Blob is stored as well.

const DB_NAME = 'NaCCER_Versions_DB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains('versions')) {
        const store = db.createObjectStore('versions', { keyPath: ['proposalId', 'versionNumber'] });
        store.createIndex('byProposal', 'proposalId', { unique: false });
        store.createIndex('byHash', 'hash', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllVersions(proposalId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('versions', 'readonly');
    const store = tx.objectStore('versions');
    const idx = store.index('byProposal');
    const req = idx.getAll(IDBKeyRange.only(proposalId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveVersionInternal(proposalId, versionNumber, hash, fileBlob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('versions', 'readwrite');
    const store = tx.objectStore('versions');
    const item = {
      proposalId,
      versionNumber,
      hash,
      timestamp: new Date().toISOString(),
      file: fileBlob
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getVersions(proposalId) {
  try {
    const list = await getAllVersions(proposalId);
    return list.sort((a,b) => a.versionNumber - b.versionNumber);
  } catch (err) {
    console.error('getVersions error:', err);
    return [];
  }
}

export async function saveNewVersion({ proposalId, fileBlob, hash, blockchainCheck = false, blockchainClient = null }) {
  // 1) fetch existing internal versions
  const existing = await getVersions(proposalId);
  // compare hash against internal
  for (const v of existing) {
    if (v.hash && v.hash.toLowerCase() === hash.toLowerCase()) {
      console.warn('Duplicate detected in internal store for proposal', proposalId, hash);
      return { duplicate: true, reason: 'internal', message: 'Duplicate proposal detected — cannot save this version' };
    }
  }

  // 2) optional blockchain check
  if (blockchainCheck && blockchainClient && typeof blockchainClient.checkHashOnChain === 'function') {
    try {
      const onChain = await blockchainClient.checkHashOnChain(hash);
      console.log('Blockchain check result for hash', hash, onChain);
      if (onChain === true) {
        console.warn('Duplicate detected on blockchain for hash', hash);
        return { duplicate: true, reason: 'blockchain', message: 'Duplicate proposal detected on blockchain — cannot save this version' };
      }
    } catch (err) {
      console.error('blockchain check failed:', err);
      // continue — do not block on-chain outages
    }
  }

  // Unique — compute next version number
  const nextVersion = existing.length > 0 ? Math.max(...existing.map(v => v.versionNumber)) + 1 : 1;
  const saved = await saveVersionInternal(proposalId, nextVersion, hash, fileBlob);
  console.log(`Saved version ${nextVersion} for proposal ${proposalId} with hash ${hash}`);
  return { duplicate: false, saved };
}

export async function getAllHashes(proposalId) {
  const versions = await getVersions(proposalId);
  return versions.map(v => v.hash);
}
