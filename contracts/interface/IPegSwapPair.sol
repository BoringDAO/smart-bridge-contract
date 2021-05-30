// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPegSwapPair {
    function mint(address to) external returns (uint256 liquidity);

    function burn(address to) external returns (uint256 amount0, uint256 amount1);

    function token0() external returns (address);

    function token1() external returns (address);

    function swap(address to, bool direction) external; // direction: token0 -> token1 or token1 -> token0

    function getReserves() external view returns (uint256, uint256);
}
