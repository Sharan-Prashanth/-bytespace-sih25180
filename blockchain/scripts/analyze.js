import fs from 'fs';
import path from 'path';
import { getRecordCount, getRecord } from '../utils/blockchainClient.js';

async function analyze() {
  try {
    console.log('Fetching record count from contract...');
    const countBn = await getRecordCount();
    const count = Number(countBn);
    console.log(`Total records on-chain: ${count}`);

    const records = [];
    for (let i = 0; i < count; i++) {
      try {
        const r = await getRecord(i);
        // r expected: [proposalId, cid, fileHash, note, timestamp, ...]
        records.push({ index: i, raw: r });
      } catch (err) {
        console.warn(`Failed to fetch record ${i}:`, err.message || err);
      }
    }

    // Normalize and analyze
    const byHash = new Map();
    const byProposal = new Map();

    for (const rec of records) {
      const raw = rec.raw;
      // handle different return shapes defensively
      const proposalId = raw[0] ? String(raw[0]) : 'unknown';
      const cid = raw[1] ? String(raw[1]) : '';
      const fileHash = raw[2] ? String(raw[2]) : '';

      if (!byHash.has(fileHash)) byHash.set(fileHash, []);
      byHash.get(fileHash).push(rec.index);

      if (!byProposal.has(proposalId)) byProposal.set(proposalId, 0);
      byProposal.set(proposalId, byProposal.get(proposalId) + 1);
    }

    const duplicateHashes = [];
    for (const [h, idxs] of byHash.entries()) {
      if (!h) continue;
      if (idxs.length > 1) duplicateHashes.push({ hash: h, indexes: idxs });
    }

    const perProposal = {};
    for (const [p, c] of byProposal.entries()) perProposal[p] = c;

    const report = {
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      uniqueHashes: byHash.size,
      duplicateCount: duplicateHashes.length,
      duplicates: duplicateHashes,
      perProposal: perProposal,
      sampleRecords: records.slice(0, 20).map(r => ({ index: r.index, raw: r.raw }))
    };

    const outDir = path.resolve('./reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `analysis-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log('Analysis complete — report saved to', outPath);
    console.log(`Total records: ${report.totalRecords}, duplicates found: ${report.duplicateCount}`);
  } catch (err) {
    console.error('Analysis failed:', err);
    process.exitCode = 1;
  }
}

analyze();
