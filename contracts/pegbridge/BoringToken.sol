// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BoringToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = "MINTER_ROLE";
    bytes32 public constant BURNER_ROLE = "BURNER_ROLE";

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyBurner {
        _burn(from, amount);
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "BoringToken: msg.sender is not admin");
        _;
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
