// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../twoway/struct.sol";

interface ISwapPair {
    function mint(address to) external returns (uint256 liquidity);

    function burn(
        address from,
        address to,
        uint256 amount,
        address feeTo,
        uint256 feeAmount
    )
        external
        returns (
            uint256,
            uint256[] memory,
            uint256[] memory
        );

    function token0() external returns (address);

    function swapOut(
        address to,
        uint256 amount,
        uint256 chainid
    ) external; // direction: token0 -> token1 or token1 -> token0

    // function swapIn(
    //     address to,
    //     uint256 amount,
    //     uint256 feeAmountFix,
    //     uint256 remainAmount,
    //     address feeToDev,
    //     uint256 chainid
    // ) external;


    function swapIn(
        SwapInParams memory params
    ) external;

    function getReserves(uint256 chainid) external view returns (uint256, uint256);

    function update() external;

    function diff0() external returns (uint256);

    function addChainIDs(uint256[] memory chainids) external;
}
