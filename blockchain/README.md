
# Proposal Registry Blockchain

This directory contains the smart contract, deployment scripts, and utilities for the project's blockchain component. The core of this component is the `ProposalRegistry` smart contract, which acts as an immutable, auditable ledger for tracking proposal submissions and their subsequent versions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Local Development and Testing](#local-development-and-testing)
  - [1. Start a Local Blockchain](#1-start-a-local-blockchain)
  - [2. Deploy the Contract](#2-deploy-the-contract)
  - [3. Run the Interaction Script](#3-run-the-interaction-script)
- [Deployment to a Live Network](#deployment-to-a-live-network)
- [Integration with the Main Application](#integration-with-the-main-application)
- [Future Enhancements](#future-enhancements)

## Architecture Overview

The blockchain component provides a trust layer for the proposal management system. It is not intended to store large files but rather to create an immutable record of each proposal's history.

Here is a high-level overview of its role in the project:

```
+----------------------+      +----------------------+      +------------------------+
|     Frontend UI      |----->|    Backend Server    |----->|   Blockchain Network   |
| (Next.js Client)     |      | (Node.js/Express)    |      | (e.g., Sepolia, Local) |
+----------------------+      +----------------------+      +------------------------+
          |                            |                             |
          |                            |                             |
          v                            v                             v
+----------------------+      +----------------------+      +------------------------+
| 1. User submits a    |      | 2. Server processes  |      | 4. `blockchainClient`  |
|    proposal form     |      |    the request and   |      |    sends a transaction |
|    (with file)       |      |    uploads the file  |      |    to the              |
+----------------------+      |    to IPFS/File      |      |    `ProposalRegistry`  |
                              |    Storage, getting  |      |    smart contract.     |
                              |    a CID and hash.   |      |                        |
                              +----------------------+      +------------------------+
                                         |
                                         v
                              +----------------------+
                              | 3. Server calls the  |
                              |  `blockchainClient`  |
                              |  utility to record   |
                              |  the metadata.       |
                              +----------------------+

```

1.  **Immutability**: Every version of a proposal, from initial draft to final approval, is recorded on the blockchain. This record includes a hash of the file, a content identifier (CID) for IPFS, a version number, and a timestamp.
2.  **Auditability**: Because the blockchain record is immutable, it provides a transparent and tamper-proof audit trail for every proposal. Anyone can verify the history of a document.
3.  **Decentralization**: While the primary application is centralized, the verification layer is decentralized, adding a layer of trust and security.

## Key Features

- **Proposal Versioning**: Stores a chronological record of all versions of a single proposal.
- **Immutable Metadata**: Each record includes:
    - `proposalId`: The unique identifier for the proposal in the main database.
    - `cid`: The Content Identifier of the proposal document on a decentralized storage system like IPFS.
    - `fileHash`: A SHA-256 hash of the document's content for integrity verification.
    - `parentHash`: The hash of the previous version of the document, creating a linked chain of versions.
    - `versionNumber` & `versionType`: Metadata to manage the proposal's lifecycle (e.g., "draft", "submitted", "revised").
    - `timestamp`: The exact time the record was created, provided by the blockchain itself.
- **On-Chain Events**: Emits a `ProposalStored` event for every new record, allowing off-chain services to listen for updates.
- **Efficient Lookups**: Provides a function to retrieve all records associated with a specific `proposalId`.

## Getting Started

Follow these steps to set up and run the blockchain component locally.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- A wallet with testnet funds (e.g., Sepolia ETH) for live deployment.

### Installation

1.  **Navigate to the directory**:
    ```bash
    cd blockchain
    ```

2.  **Install dependencies**:
    Using pnpm:
    ```bash
    pnpm install
    ```
    Or using npm:
    ```bash
    npm install
    ```

## Local Development and Testing

We use [Hardhat](https://hardhat.org/) for local development. You can run a local blockchain, deploy the contract, and interact with it.

### 1. Start a Local Blockchain

Open a terminal and run the following command to start a local Hardhat node. This simulates a live blockchain on your machine.

```bash
npx hardhat node
```

This will start a JSON-RPC server at `http://127.0.0.1:8545/` and provide you with 20 test accounts, each funded with 10000 ETH.

### 2. Deploy the Contract

Keep the first terminal running. Open a **new terminal** and run the deployment script. This will compile the contract and deploy it to the local Hardhat node.

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Upon success, you will see the deployed contract address. This address is also saved to `blockchain/deployed.json` for other scripts to use.

### 3. Run the Interaction Script

To verify that the contract is working, run the test interaction script. This script will connect to the deployed contract and perform test transactions.

```bash
npx hardhat run scripts/test-interaction.js --network localhost
```

This script performs the following actions:
- Reads the contract address from `deployed.json`.
- Connects to the `ProposalRegistry` contract.
- Calls `storeProposalRecordWithMeta` to store a sample record.
- Calls `getRecordsByProposal` to retrieve and display the record that was just stored.

## Deployment to a Live Network

To deploy the contract to a public testnet like Sepolia:

1.  **Create a `.env` file** in the `blockchain` directory with the following contents:
    ```env
    SEPOLIA_RPC_URL="YOUR_ALCHEMY_OR_INFURA_RPC_URL"
    WALLET_PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
    ```
    - **SEPOLIA_RPC_URL**: The endpoint for the Sepolia network from a node provider like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).
    - **WALLET_PRIVATE_KEY**: The private key of the account you want to use for deployment. **WARNING**: Do not commit this file to Git.

2.  **Run the deployment script** with the `sepolia` network flag:
    ```bash
    npx hardhat run scripts/deploy.js --network sepolia
    ```

3.  **Update the Server**: After deployment, take the new contract address and update the `CONTRACT_ADDRESS` environment variable in the main server's `.env` file.

## Integration with the Main Application

The backend server interacts with the smart contract via the `blockchain/utils/blockchainClient.js` module.

- **Initialization**: The client initializes a connection to the blockchain using environment variables (`BLOCKCHAIN_RPC_URL`, `WALLET_PRIVATE_KEY`, `CONTRACT_ADDRESS`).
- **Storing Records**: When a proposal is created or updated, the server should call the `storeProposalRecordWithMeta` function from the client.
- **Retrieving Records**: To display a proposal's history, the server can call `getRecordsByProposal`.

## Future Enhancements

- **Access Control**: Implement role-based access control (e.g., using OpenZeppelin's `AccessControl`) to restrict who can store records. For example, only authorized government officials or system administrators should be able to call `storeProposalRecordWithMeta`.
- **DAI/Token Integration**: For S&T fund proposals, the contract could be extended to manage the distribution of funds using a stablecoin like DAI or a native governance token.
- **Gasless Transactions**: For a better user experience, implement meta-transactions to allow users to interact with the contract without needing to pay for gas themselves.
- **Upgradable Contracts**: Use the UUPS proxy pattern to allow the contract logic to be upgraded in the future without losing the existing data or changing the contract address.
- **On-Chain Governance**: For truly decentralized decision-making, a DAO (Decentralized Autonomous Organization) could be formed where token holders vote on proposals directly on-chain.
