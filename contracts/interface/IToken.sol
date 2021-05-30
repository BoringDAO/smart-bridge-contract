// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IToken is IERC20{
    function mint(address to, uint amount) external returns(bool);
    function burn(address from, uint amount) external returns(bool);
}