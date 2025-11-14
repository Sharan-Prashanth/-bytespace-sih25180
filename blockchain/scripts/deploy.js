import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract from:", deployer.address);

  const ProposalRegistry = await ethers.getContractFactory("ProposalRegistry");
  const registry = await ProposalRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("Contract Deployed at:", address);

  fs.writeFileSync(
    "./deployed.json",
    JSON.stringify({ address }, null, 2)
  );

  console.log("Saved deployed address → deployed.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
