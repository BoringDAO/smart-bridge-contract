// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BoringToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";

    uint8 private _decimals;

    constructor(string memory _name, string memory _symbol, uint8 decimals_) ERC20(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyBurner {
        _burn(from, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    modifier onlyMinter {
        require(hasRole(MINTER_ROLE, msg.sender), "BoringToken: msg.sender is not minter");
        _;
    }

    modifier onlyBurner {
        require(hasRole(BURNER_ROLE, msg.sender), "BoringToken: msg.sender is not burner");
        _;
    }
}
