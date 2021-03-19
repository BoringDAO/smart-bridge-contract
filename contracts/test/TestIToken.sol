// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestIToken is ERC20 {
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, 1000 * 10**18);
    }

    function mint(address to, uint amount) external returns(bool) {
        _mint(to, amount);
        return true;
    }
    
    function burn(address to, uint amount) external returns(bool) {
        _burn(to, amount);
        return true;
    }
}