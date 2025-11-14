import fs from "fs";
import crypto from "crypto";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { ethers } from "ethers";
import deployed from "../deployed.json" assert { type: "json" };

// Configure IPFS (you can use Infura or local node)
const ipfs = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0"
});

// Hardhat local network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

// Load ABI
const abi = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/ProposalRegistry.sol/ProposalRegistry.json",
    "utf8"
  )
).abi;

// Initialize contract instance
const contract = new ethers.Contract(deployed.address, abi, signer);

export async function computeFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return "0x" + hash;
}

export async function uploadFileToIPFS(filePath) {
  const file = fs.readFileSync(filePath);
  const result = await ipfs.add(file);
  return result.cid.toString();
}

export async function storeOnChain(proposalId, cid, fileHash, note) {
  const tx = await contract.storeProposalRecord(
    proposalId,
    cid,
    fileHash,
    note
  );

  const receipt = await tx.wait();
  return receipt;
}

export async function getRecordsByProposal(proposalId) {
  return await contract.getRecordsByProposal(proposalId);
}

export async function getRecord(index) {
  return await contract.getRecord(index);
}
