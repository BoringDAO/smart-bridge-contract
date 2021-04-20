// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface IPegSwap {
    function swapToken0ForToken1(
        address token0,
        uint256 amountIn,
        address to
    ) external;

    function swapToken1ForToken0(
        address token0,
        uint256 amountIn,
        address to
    ) external;

    function getPair(address token) external view returns (address);

    function getMaxToken1AmountOut(address token0) external view returns (uint256);
}
