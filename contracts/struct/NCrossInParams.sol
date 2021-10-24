// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

struct NCrossInParams {
    address _originToken;
    uint256 _originChainId;
    uint256 fromChainId;
    uint256 toChainId;
    address from;
    address to;
    uint256 amount;
    string  txid;
}
