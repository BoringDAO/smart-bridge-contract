// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./lib/SafeDecimalMath.sol";
import "./ProposalVote.sol";

contract CrossLock is ProposalVote, AccessControl {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using SafeDecimalMath for uint256;

    // eg.ethToken => other
    mapping(address => mapping(uint256 => address)) public supportToken;
    mapping(address => mapping(uint256 => bytes32)) public roleFlag;

    mapping(string => bool) public txUnlocked;

    event Lock(address token0, address token1, uint256 chainID, address locker, address to, uint256 amount);
    event Unlock(address token0, address token1, uint256 chainID, address from, address to, uint256 amount, string txid);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addSupportToken(
        address token0,
        address token1,
        uint256 chainID,
        bytes32 _roleFlag
    ) public onlyAdmin {
        require(supportToken[token0][chainID] == address(0), "Toke already Supported");
        require(_roleFlag != bytes32(0), "role falg should not bytes32(0)");
        require(roleFlag[token0][chainID] == bytes32(0), "role flag already exist");
        supportToken[token0][chainID] = token1;
        roleFlag[token0][chainID] = _roleFlag;
    }

    function removeSupportToken(address token0, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] != address(0), "Toke not Supported");
        delete supportToken[token0][chainID];
    }

    function removeRoleFlag(address token0, uint256 chainID) public onlyAdmin {
        require(roleFlag[token0][chainID] != bytes32(0), "roleFlag not Supported");
        delete roleFlag[token0][chainID];
    }

    function addSupportTokens(
        address[] memory token0Addrs,
        address[] memory token1Addrs,
        uint256[] memory chainIDs,
        bytes32[] memory _roleFlags
    ) public {
        require(token0Addrs.length == token1Addrs.length, "Token length not match");
        require(token0Addrs.length == _roleFlags.length, "Token length not match");
        require(token0Addrs.length == chainIDs.length, "Token length not match");
        for (uint256 i; i < token0Addrs.length; i++) {
            addSupportToken(token0Addrs[i], token1Addrs[i], chainIDs[i], _roleFlags[i]);
        }
    }

    function removeSupportTokens(address[] memory addrs, uint256[] memory chainIDs) public {
        require(addrs.length == chainIDs.length, "Token length not match");
        for (uint256 i; i < addrs.length; i++) {
            removeSupportToken(addrs[i], chainIDs[i]);
            removeRoleFlag(addrs[i], chainIDs[i]);
        }
    }

    function lock(
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token0, chainID) {
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount);
        emit Lock(token0, supportToken[token0][chainID], chainID, msg.sender, to, amount);
    }

    function unlock(
        address token0,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token0, chainID) onlyCrosser(token0, chainID) whenNotUnlocked(txid) {
        bool result = _vote(token0, from, to, amount, txid);
        if (result) {
            txUnlocked[txid] = true;
            IERC20(token0).safeTransfer(to, amount);
            emit Unlock(token0, supportToken[token0][chainID], chainID, from, to, amount, txid);
        }
    }

    function setThreshold(address token0, uint256 _threshold) public onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    modifier onlySupportToken(address token0, uint256 chainID) {
        require(supportToken[token0][chainID] != address(0), "Lock::Not Support Token");
        _;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "caller is not admin");
        _;
    }

    modifier onlyCrosser(address token0, uint256 chainID) {
        require(hasRole(roleFlag[token0][chainID], msg.sender), "caller is not crosser");
        _;
    }

    modifier whenNotUnlocked(string memory _txid) {
        require(txUnlocked[_txid] == false, "tx unlocked");
        _;
    }
}
