// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakingReward {
    function onChefReward(address user) external;

    function notifyRewardAmount(uint256 reward, uint256 duration) external;

    function earned(address account) external view returns (uint256);

    function rewardRate() external view returns (uint256);
}
