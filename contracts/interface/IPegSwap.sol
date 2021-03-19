// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IPegSwap {
    function swap(address token0, uint256 amountIn, address to) external; 
    function burn(address to) external returns (uint256 amount0, uint256 amount1);
}