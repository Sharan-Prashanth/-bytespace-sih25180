const { ethers } = require("hardhat");
const fs = require("fs");

function getDeployedAddress() {
  const deployed = JSON.parse(fs.readFileSync("./deployed.json", "utf8"));
  return deployed.address;
}

async function main() {
  console.log("--- Starting Interaction Script ---");

  const contractAddress = getDeployedAddress();
  if (!contractAddress) {
    throw new Error("Contract address not found in deployed.json");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const registry = await ethers.getContractAt("ProposalRegistry", contractAddress, signer);
  console.log("Attached to ProposalRegistry at:", await registry.getAddress());

  const proposalId = 101;
  const cid = "QmXgZAUf3u4V2w6a9q6A7s5e4d3c2b1a0z";
  const fileHash = "0x" + "a".repeat(64);
  const parentHash = "0x" + "0".repeat(64);
  const versionNumber = 1;
  const versionType = "draft";
  const note = "Initial submission for review.";

  console.log(`\n--- Storing a new record for Proposal ID: ${proposalId} ---`);

  const tx = await registry.storeProposalRecordWithMeta(
    proposalId, cid, fileHash, parentHash, versionNumber, versionType, note
  );

  console.log("Transaction sent. Waiting for confirmation...");
  const receipt = await tx.wait();

  console.log("✅ Transaction confirmed!");
  console.log("Transaction Hash:", receipt.hash);

  console.log(`\n--- Retrieving records for Proposal ID: ${proposalId} ---`);

  const records = await registry.getRecordsByProposal(proposalId);

  if (records.length > 0) {
    console.log(`✅ Found ${records.length} record(s).`);
    const record = records[0];
    console.log("Record[0] Details:");
    console.log("  - Proposal ID:", record.proposalId.toString());
    console.log("  - Stored By:", record.storedBy);
    console.log("  - CID:", record.cid);
    console.log("  - Version:", record.versionNumber.toString());
    console.log("  - Timestamp:", new Date(Number(record.timestamp) * 1000).toLocaleString());
  } else {
    console.log("❌ No records found for this proposal ID.");
  }

  console.log("\n--- Interaction Script Finished ---");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });