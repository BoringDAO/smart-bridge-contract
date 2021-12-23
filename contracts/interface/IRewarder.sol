// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IRewarder {
    function onChefReward(uint256 pid, address user, uint256 chefTokenAmount) external;
}