import express from "express";
import path from "path";
import {
  computeFileHash,
  uploadFileToIPFS,
  storeOnChain
} from "../utils/blockchainShim.js";

const router = express.Router();

router.post("/store", async (req, res) => {
  try {
    const { proposalId, filePath, note } = req.body;

    const absPath = path.resolve(filePath);
    const fileHash = await computeFileHash(absPath);
    const cid = await uploadFileToIPFS(absPath);
    const receipt = await storeOnChain(proposalId, cid, fileHash, note);

    res.json({
      success: true,
      cid,
      fileHash,
      txHash: receipt.transactionHash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
