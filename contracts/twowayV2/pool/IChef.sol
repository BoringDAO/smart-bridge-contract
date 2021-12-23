// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IChef {
	function depositToken(uint _pid) external view returns(address);
}