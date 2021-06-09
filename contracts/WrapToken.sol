// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/IMB.sol";

contract WrapToken is IMB, AccessControl, IERC20, IERC20Metadata {
    using SafeERC20 for IERC20;

    bytes32 public MINTER_ROLE = "MINTER_ROLE";
    bytes32 public BURNER_ROLE = "BURNER_ROLE";

    IERC20 public underToken;
    address public dispatcher;

    constructor(address admin, address _dispatcher, IERC20 _underToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        dispatcher = _dispatcher;
        underToken = _underToken;
    }

    function setDispatcher(address _dispatcher) external onlyAdmin {
        dispatcher = _dispatcher;
    }

    function name() public view virtual override returns (string memory) {
        return IERC20Metadata(address(underToken)).name();
    }

    function symbol() public view virtual override returns (string memory) {
        return IERC20Metadata(address(underToken)).symbol();
    }

    function decimals() public view virtual override returns (uint8) {
        return IERC20Metadata(address(underToken)).decimals();
    }

    function totalSupply() public view virtual override returns (uint256) {
        return underToken.totalSupply();
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return underToken.balanceOf(account);
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        return underToken.transfer(recipient, amount);
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return underToken.allowance(owner, spender);
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        return underToken.approve(spender, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        return underToken.transferFrom(sender, recipient, amount);
    }

    function mint(address to, uint256 amount) external override onlyMinter returns (bool) {
        underToken.safeTransferFrom(dispatcher, to, amount);
        return true;
    }

    function burn(address to, uint256 amount) external override onlyBurner returns (bool) {
        underToken.safeTransferFrom(to, dispatcher, amount);
        return true;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "WrapToken::onlyAdmin only admin can call");
        _;
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