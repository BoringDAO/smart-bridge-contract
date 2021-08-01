// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ITwoWay {
    function burnBoringToken(address sender, address token0, uint256 chainID, address to, uint256 amount) external;
}