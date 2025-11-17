// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProposalRegistry {
    struct Record {
        uint256 proposalId;
        address storedBy;
        string cid;
        bytes32 fileHash;
        bytes32 parentHash; // hash of previous version (0x0 for first)
        uint256 versionNumber; // sequential version number starting at 1
        string versionType; // e.g., "draft", "approved", "staff_completed"
        uint256 timestamp;
        string note;
    }

    Record[] public records;
    mapping(uint256 => uint256[]) public proposalToRecordIndexes;

    event ProposalStored(
        uint256 indexed recordIndex,
        uint256 indexed proposalId,
        string cid,
        bytes32 fileHash,
        bytes32 parentHash,
        uint256 versionNumber,
        string versionType,
        address indexed storedBy,
        uint256 timestamp
    );

    // Generic record storage (keeps backward-compatibility via storeProposalRecordWithMeta)
    function storeProposalRecord(
        uint256 proposalId,
        string calldata cid,
        bytes32 fileHash,
        string calldata note
    ) external returns (uint256) {
        // default parentHash = 0x0, versionNumber = 1, versionType = "generic"
        return storeProposalRecordWithMeta(proposalId, cid, fileHash, bytes32(0), 1, "generic", note);
    }

    // New generic storage with version metadata
    function storeProposalRecordWithMeta(
        uint256 proposalId,
        string calldata cid,
        bytes32 fileHash,
        bytes32 parentHash,
        uint256 versionNumber,
        string calldata versionType,
        string calldata note
    ) public returns (uint256) {
        Record memory r = Record({
            proposalId: proposalId,
            storedBy: msg.sender,
            cid: cid,
            fileHash: fileHash,
            parentHash: parentHash,
            versionNumber: versionNumber,
            versionType: versionType,
            timestamp: block.timestamp,
            note: note
        });

        records.push(r);
        uint256 index = records.length - 1;
        proposalToRecordIndexes[proposalId].push(index);

        emit ProposalStored(
            index,
            proposalId,
            cid,
            fileHash,
            parentHash,
            versionNumber,
            versionType,
            msg.sender,
            block.timestamp
        );

        return index;
    }

    // Convenience for draft versions
    function storeDraftVersion(
        uint256 proposalId,
        string calldata cid,
        bytes32 fileHash,
        bytes32 parentHash,
        uint256 versionNumber,
        string calldata metadata
    ) external returns (uint256) {
        return storeProposalRecordWithMeta(proposalId, cid, fileHash, parentHash, versionNumber, "draft", metadata);
    }

    function getRecord(uint256 index) external view returns (Record memory) {
        require(index < records.length, "Invalid index");
        return records[index];
    }

    function getRecordsByProposal(uint256 proposalId)
        external
        view
        returns (uint256[] memory)
    {
        return proposalToRecordIndexes[proposalId];
    }

    

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
}
