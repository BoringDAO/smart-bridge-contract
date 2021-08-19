
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

struct SwapInParams {
    address to;
    uint amount1;
    uint feeAmountFix; 
    uint remainAmount;
    address feeToDev;
    uint chainID;
}