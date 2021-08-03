// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    uint8 private _decimals;

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    constructor(string memory _name, string memory _symbol, uint8 decimals_) ERC20(_name, _symbol) {
        _mint(msg.sender, 100000000 * 10**decimals_);
        _decimals = decimals_;
    }

    function faucet() external {
        _mint(msg.sender, 100000 * 10**_decimals);
    }
}
