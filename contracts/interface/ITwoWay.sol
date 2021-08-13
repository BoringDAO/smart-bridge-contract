// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ITwoWay {
    function swapToken0ForToken1(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) external;

    function swapToken1ForToken0(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) external;

    function getPair(address token, uint256 chainID) external view returns (address);

    function getMaxToken1AmountOut(address token0, uint256 chainID) external view returns (uint256);

    function getMaxToken0AmountOut(address token0, uint256 chainID) external view returns (uint256);

    function burnBoringToken(
        address sender,
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) external;
}
