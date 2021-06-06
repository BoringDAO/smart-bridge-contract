// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMB {
    function mint(address to, uint amount) external returns(bool);
    function burn(address from, uint amount) external returns(bool);
}