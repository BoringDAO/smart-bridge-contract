// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

struct OutParam {
	uint fromChainId;
	address fromToken;
	address from;
	uint toChainId;
	// address toToken;
	address to;
	uint amount;
}

struct InParam {
	uint fromChainId;
	address fromToken;
	address from;
	uint toChainId;
	address toToken;
	address to;
	uint amount;
}