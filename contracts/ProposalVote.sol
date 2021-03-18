// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Structs.sol";

contract ProposalVote {
    using SafeMath for uint256;

    mapping(bytes32 => Proposal) public proposalOf;

    uint256 public threshold;

    event ProposalVoted(
        address from,
        address to,
        uint256 amount,
        address proposer,
        uint256 count,
        uint256 threshold
    );

    event ThresholdChanged(
        uint256 oldThreshold,
        uint256 newThreshold
    );

    constructor(uint256 _threshold) {
        threshold = _threshold;
    }

    function _setThreshold(uint256 _threshold) internal virtual {
        uint256 oldThreshold = threshold;
        threshold = _threshold;
        emit ThresholdChanged(oldThreshold, threshold);
    }

    function _vote(
        address tokenTo,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) internal virtual returns(bool result){
        bytes32 mid = keccak256(abi.encodePacked(tokenTo, from, to, amount, txid));
        Proposal storage p = proposalOf[mid];
        if (proposalOf[mid].isExist == false) {
            // create proposal
            p.tokenTo = tokenTo;
            p.from = from;
            p.to = to;
            p.amount = amount;
            p.count = 1;
            p.txid = txid;
            p.isExist = true;
            p.isVoted[msg.sender] = true;
        } else {
            require(p.isFinished == false, "_vote::proposal finished");
            require(p.isVoted[msg.sender] == false, "_vote::msg.sender voted");
            p.count = p.count.add(1);
            p.isVoted[msg.sender] = true;
        }
        if (p.count >= threshold) {
            p.isFinished = true;
            result = true;
        }
        emit ProposalVoted(from, to, amount, msg.sender, p.count, threshold);
    }
}
