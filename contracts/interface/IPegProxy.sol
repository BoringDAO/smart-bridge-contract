// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPegProxy {
    function burnBoringToken(address sender, address token0, uint256 chainID, address to, uint256 amount) external;
}