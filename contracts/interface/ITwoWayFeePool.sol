// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ITwoWayFeePool {
	function notify(uint256 amount) external;
}