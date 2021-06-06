// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/IMB.sol";

contract WrapToken is IMB, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public MINTER_ROLE = "MINTER_ROLE";
    bytes32 public BURNER_ROLE = "BURNER_ROLE";

    IERC20 public underToken;
    address public dispatcher;

    constructor(address admin, address _dispatcher) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        dispatcher = _dispatcher;
    }

    function setDispatcher(address _dispatcher) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not Dispatcher");
        dispatcher = _dispatcher;
    }


    function mint(address to, uint256 amount) external override onlyMinter returns (bool) {
        underToken.safeTransferFrom(dispatcher, to, amount);
        return true;
    }

    function burn(address to, uint256 amount) external override onlyBurner returns (bool) {
        underToken.safeTransferFrom(to, dispatcher, amount);
        return true;
    }

    modifier onlyMinter {
        require(hasRole(MINTER_ROLE, msg.sender), "Token::caller is not minter");
        _;
    }

    modifier onlyBurner {
        require(hasRole(BURNER_ROLE, msg.sender), "Token::caller is not burner");
        _;
    }
}