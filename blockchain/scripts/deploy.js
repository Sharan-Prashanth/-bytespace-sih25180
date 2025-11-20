const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  const ProposalRegistry = await ethers.getContractFactory("ProposalRegistry");
  const registry = await ProposalRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("ProposalRegistry deployed to:", address);

  fs.writeFileSync(
    "./deployed.json",
    JSON.stringify({ address: address }, null, 2)
  );
  console.log("Saved deployed address to deployed.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });