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

    // eg.ethToken => bscToken
    mapping(address => address) public supportToken;
    mapping(address => bytes32) public roleFlag;

    mapping(string => bool) public txUnlocked;

    event Lock(
        address ethToken,
        address bscToken,
        address locker,
        address to,
        uint256 amount
    );
    event Unlock(
        address ethToken,
        address bscToken,
        address from,
        address to,
        uint256 amount,
        string txid
    );

    constructor(uint256 _threshold) ProposalVote(_threshold) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addSupportToken(address ethTokenAddr, address bscTokenAddr, bytes32 _roleFlag)
        public
        onlyAdmin
    {
        require(
            supportToken[ethTokenAddr] == address(0),
            "Toke already Supported"
        );
        require(_roleFlag != bytes32(0), "role falg should not bytes32(0)");
        require(roleFlag[ethTokenAddr] == bytes32(0), "role flag already exist");
        supportToken[ethTokenAddr] = bscTokenAddr;
        roleFlag[ethTokenAddr] = _roleFlag;
    }

    function removeSupportToken(address ethTokenAddr) public onlyAdmin {
        require(supportToken[ethTokenAddr] != address(0), "Toke not Supported");
        delete supportToken[ethTokenAddr];
    }

    function removeRoleFlag(address token) public onlyAdmin {
        require(roleFlag[token] != bytes32(0), "roleFlag not Supported");
        delete roleFlag[token];
    }

    function addSupportTokens(
        address[] memory ethTokenAddrs,
        address[] memory bscTokenAddrs,
        bytes32[] memory _roleFlags
    ) public {
        require(
            ethTokenAddrs.length == bscTokenAddrs.length,
            "Token length not match"
        );
        require(
            ethTokenAddrs.length == _roleFlags.length,
            "Token length not match"
        );
        for (uint256 i; i < ethTokenAddrs.length; i++) {
            addSupportToken(ethTokenAddrs[i], bscTokenAddrs[i], _roleFlags[i]);
        }
    }

    function removeSupportTokens(address[] memory addrs) public {
        for (uint256 i; i < addrs.length; i++) {
            removeSupportToken(addrs[i]);
            removeRoleFlag(addrs[i]);
        }
    }

    function lock(
        address token,
        address to,
        uint256 amount
    ) public onlySupportToken(token) {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Lock(token, supportToken[token], msg.sender, to, amount);
    }

    function unlock(
        address token,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token) onlyCrosser(token) whenNotUnlocked(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            txUnlocked[txid] = true;
            IERC20(token).safeTransfer(to, amount);
            emit Unlock(token, supportToken[token], from, to, amount, txid);
        }
    }

    function setThreshold(uint _threshold) public onlyAdmin {
        _setThreshold(_threshold);
    }

    modifier onlySupportToken(address token) {
        require(supportToken[token] != address(0), "Lock::Not Support Token");
        _;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "caller is not admin");
        _;
    }

    modifier onlyCrosser(address token) {
        require(hasRole(roleFlag[token], msg.sender), "caller is not crosser");
        _;
    }

    modifier whenNotUnlocked(string memory _txid) {
        require(txUnlocked[_txid] == false, "tx unlocked");
        _;
    }
}
