// Minimal blockchain helper for client-side duplicate check and optional push.
// This module will try to connect to a JSON-RPC provider set by
// `process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC` or `window.__BLOCKCHAIN_RPC__`.
// It uses ethers when available. If no RPC or ethers is available, functions
// become no-ops (return false for checks).

let ethersLib = null;
try {
  // dynamic import to avoid bundling on environments that don't support it
  // (in Node this will resolve). In browser, bundler may include it if present.
  // We'll lazily import inside functions.
} catch (e) {}

async function getProvider() {
  const rpc = (typeof window !== 'undefined' && window.__BLOCKCHAIN_RPC__) || process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC || null;
  if (!rpc) return null;
  if (!ethersLib) ethersLib = await import('ethers').then(m => m);
  return new ethersLib.providers.JsonRpcProvider(rpc);
}

// Example: check if a given hash exists on-chain by scanning records.
// This function assumes a contract ABI + address are available via
// `process.env.NEXT_PUBLIC_CONTRACT_ADDRESS` and `client/public/contractAbi.json`.
export async function checkHashOnChain(hash) {
  try {
    const provider = await getProvider();
    if (!provider) {
      console.log('Blockchain RPC not configured — skipping on-chain check');
      return false;
    }

    // try to load ABI and address
    let abi = null;
    try {
      // attempt to fetch ABI from public path
      const res = await fetch('/contractAbi.json');
      if (res.ok) abi = await res.json();
    } catch (e) {
      console.warn('Could not load contract ABI from /contractAbi.json', e.message);
    }

    const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || (typeof window !== 'undefined' && window.__CONTRACT_ADDRESS__) || null;
    if (!abi || !address) {
      console.log('Contract ABI or address not configured — skipping on-chain check');
      return false;
    }

    if (!ethersLib) ethersLib = await import('ethers').then(m => m);
    const contract = new ethersLib.Contract(address, abi, provider);

    // If the contract exposes getRecordCount() and getRecord(i) use them.
    if (typeof contract.getRecordCount === 'function') {
      const countBn = await contract.getRecordCount();
      const count = Number(countBn);
      console.log('Blockchain records count:', count);
      for (let i = 0; i < count; i++) {
        try {
          const rec = await contract.getRecord(i);
          // rec[2] expected to be fileHash (0x...)
          if (!rec) continue;
          const fileHash = rec[2] ? String(rec[2]) : '';
          console.log('On-chain record', i, 'hash:', fileHash);
          if (fileHash && fileHash.toLowerCase() === hash.toLowerCase()) return true;
        } catch (err) {
          console.warn('Failed to read record', i, err.message || err);
        }
      }
    }

    return false;
  } catch (err) {
    console.error('checkHashOnChain error:', err);
    return false;
  }
}

// Optionally push hash to chain (store only hash). This will attempt to call
// a method `storeHash(bytes32)` or `storeProposalRecord(proposalId, cid, fileHash, note)` if present.
export async function pushHashToChain({ hash, proposalId = null, note = '' }) {
  try {
    const provider = await getProvider();
    if (!provider) {
      console.log('Blockchain RPC not configured — skipping push');
      return { success: false, reason: 'no_rpc' };
    }
    if (!ethersLib) ethersLib = await import('ethers').then(m => m);
    const signer = provider.getSigner();

    let abi = null;
    try {
      const res = await fetch('/contractAbi.json');
      if (res.ok) abi = await res.json();
    } catch (e) {}
    const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || (typeof window !== 'undefined' && window.__CONTRACT_ADDRESS__) || null;
    if (!abi || !address) return { success: false, reason: 'no_abi_or_address' };

    const contract = new ethersLib.Contract(address, abi, signer);

    // Try common functions
    if (typeof contract.storeProposalRecord === 'function' && proposalId) {
      const tx = await contract.storeProposalRecord(proposalId, '', hash, note || 'client-pushed-hash');
      const receipt = await tx.wait();
      console.log('Pushed hash to chain, txHash:', receipt.transactionHash || receipt.transactionHash === undefined ? receipt : receipt.transactionHash);
      return { success: true, receipt };
    }

    if (typeof contract.storeHash === 'function') {
      const tx = await contract.storeHash(hash);
      const receipt = await tx.wait();
      return { success: true, receipt };
    }

    return { success: false, reason: 'no_store_method' };
  } catch (err) {
    console.error('pushHashToChain error:', err);
    return { success: false, error: String(err) };
  }
}
