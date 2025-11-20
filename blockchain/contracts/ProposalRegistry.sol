// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A simple console log for debugging during development
import "hardhat/console.sol";

contract ProposalRegistry {
    struct Record {
        uint256 proposalId;
        address storedBy;
        string cid;
        bytes32 fileHash;
        bytes32 parentHash;
        uint256 versionNumber;
        string versionType;
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

    function storeProposalRecordWithMeta(
        uint256 proposalId,
        string calldata cid,
        bytes32 fileHash,
        bytes32 parentHash,
        uint256 versionNumber,
        string calldata versionType,
        string calldata note
    ) public returns (uint256) {
        console.log("Storing record for proposalId:", proposalId);

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

    function getRecord(uint256 index) external view returns (Record memory) {
        require(index < records.length, "Invalid index");
        return records[index];
    }

    function getRecordsByProposal(uint256 proposalId)
        external
        view
        returns (Record[] memory)
    {
        uint256[] memory indexes = proposalToRecordIndexes[proposalId];
        Record[] memory proposalRecords = new Record[](indexes.length);

        for (uint i = 0; i < indexes.length; i++) {
            proposalRecords[i] = records[indexes[i]];
        }

        return proposalRecords;
    }

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
}