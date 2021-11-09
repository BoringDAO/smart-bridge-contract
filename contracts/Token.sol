// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/IToken.sol";

contract Token is ERC20, IToken, AccessControl {
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function mint(address to, uint256 amount) public override onlyMinter returns (bool) {
        _mint(to, amount);
        return true;
    }

    function burn(address to, uint256 amount) public override onlyBurner returns (bool) {
        _burn(to, amount);
        return true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(to != address(this), "Token::to should not be token contract");
        super._beforeTokenTransfer(from, to, amount);
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Token::caller is not minter");
        _;
    }

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "Token::caller is not burner");
        _;
    }
}
