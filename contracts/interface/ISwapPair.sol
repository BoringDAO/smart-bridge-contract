// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ISwapPair {
    function mint(address to) external returns (uint256 liquidity);

    function burn(address from, address to, uint amount, address feeTo, uint feeAmount) external returns (uint256 amount0, uint256 amount1);

    function token0() external returns (address);

    function token1() external returns (address);

    function swapOut(address to, uint amount) external; // direction: token0 -> token1 or token1 -> token0
    function swapIn(address to, uint256 amount, uint256 feeAmountFix, uint256 remainAmount, address feeToDev) external;

    function getReserves() external view returns (uint256, uint256);
}
