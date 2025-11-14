// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProposalRegistry {
    struct Record {
        uint256 proposalId;
        address storedBy;
        string cid;
        bytes32 fileHash;
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
        address indexed storedBy,
        uint256 timestamp
    );

    function storeProposalRecord(
        uint256 proposalId,
        string calldata cid,
        bytes32 fileHash,
        string calldata note
    ) external returns (uint256) {
        Record memory r = Record({
            proposalId: proposalId,
            storedBy: msg.sender,
            cid: cid,
            fileHash: fileHash,
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
        returns (uint256[] memory)
    {
        return proposalToRecordIndexes[proposalId];
    }

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
}
