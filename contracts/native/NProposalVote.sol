// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract NProposalVote {
    using SafeMath for uint256;

    mapping(address => uint256) public threshold;

    mapping(string => bool) isFinished;
    mapping(string => mapping(address => bool)) isVoted;
    mapping(string => uint256) counter;

    event ProposalVoted(address token, address proposer, uint256 count, uint256 threshold);

    event ThresholdChanged(address token, uint256 oldThreshold, uint256 newThreshold);

    function _setThreshold(address token, uint256 _threshold) internal virtual {
        uint256 oldThreshold = threshold[token];
        threshold[token] = _threshold;
        emit ThresholdChanged(token, oldThreshold, _threshold);
    }

    function _vote(
        address token,
        string memory txid
    ) internal virtual returns (bool result) {
        require(threshold[token] > 0, "ProposalVote: threshold should be greater than 0");
        uint256 count = threshold[token];
        require(isFinished[txid] == false, "_vote::proposal finished");
        require(isVoted[txid][msg.sender] == false, "_vote::msg.sender voted");
        counter[txid] = counter[txid].add(1);
        isVoted[txid][msg.sender] = true;

        if (counter[txid] >= count) {
            isFinished[txid] = true;
            result = true;
        }
        emit ProposalVoted(token, msg.sender, counter[txid], count);
    }
}
