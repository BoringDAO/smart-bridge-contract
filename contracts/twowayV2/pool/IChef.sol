// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IChef {
    function depositTokenAmount(uint256 _pid, address user) external view returns (uint256 supply, uint256 userAmount);
}
