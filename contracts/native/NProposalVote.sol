// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../struct/NCrossInParams.sol";

contract NProposalVote {
    using SafeMath for uint256;

    mapping(address => uint256) public threshold;

    mapping(bytes32 => bool) isFinished;
    mapping(bytes32 => mapping(address => bool)) isVoted;
    mapping(bytes32 => uint256) counter;

    event ProposalVoted(address token, address proposer, uint256 count, uint256 threshold);

    event ThresholdChanged(address token, uint256 oldThreshold, uint256 newThreshold);

    function _setThreshold(address token, uint256 _threshold) internal virtual {
        uint256 oldThreshold = threshold[token];
        threshold[token] = _threshold;
        emit ThresholdChanged(token, oldThreshold, _threshold);
    }

    function _vote(
        NCrossInParams memory p
    ) internal virtual returns (bool result) {
        require(threshold[p._originToken] > 0, "ProposalVote: threshold should be greater than 0");
        uint256 count = threshold[p._originToken];
        bytes32 mid = keccak256(abi.encode(p));
        require(isFinished[mid] == false, "_vote::proposal finished");
        require(isVoted[mid][msg.sender] == false, "_vote::msg.sender voted");
        counter[mid] = counter[mid].add(1);
        isVoted[mid][msg.sender] = true;

        if (counter[mid] >= count) {
            isFinished[mid] = true;
            result = true;
        }
        emit ProposalVoted(p._originToken, msg.sender, counter[mid], count);
    }
}
