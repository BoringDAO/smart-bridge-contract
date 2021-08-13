// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMB {
    function mint(address to, uint256 amount) external returns (bool);

    function burn(address from, uint256 amount) external returns (bool);
}
