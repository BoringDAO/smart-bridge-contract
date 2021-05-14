// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/IToken.sol";

contract Token is ERC20, IToken, AccessControl {

    bytes32 public MINTER_ROLE = "MINTER_ROLE";
    bytes32 public BURNER_ROLE = "BURNER_ROLE";

    constructor(string memory _name, string memory _symbol, uint8 _decimal, address admin) ERC20(_name, _symbol) {
        _setupDecimals(_decimal);
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function mint(address to, uint amount) public override onlyMinter returns(bool) {
        _mint(to, amount);
        return true;
    }

    function burn(address to, uint amount) public override onlyBurner returns(bool) {
        _burn(to, amount);  
        return true;
    }

    modifier onlyMinter {
        require(hasRole(MINTER_ROLE, msg.sender), "caller is not minter");
        _;
    }

    modifier onlyBurner {
        require(hasRole(BURNER_ROLE, msg.sender), "caller is not burner");
        _;
    }

}