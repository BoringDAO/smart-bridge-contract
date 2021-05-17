// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interface/IToken.sol";
import "./ProposalVote.sol";
import "./Toll.sol";

contract Bridge is ProposalVote, Toll, AccessControl {
    using SafeMath for uint256;

    // eg.ethToken => other
    mapping(address => IToken) public supportToken;
    mapping(address => bytes32) public roleFlag;
    mapping(string => bool) public txMinted;

    event CrossBurn(address token0, address token1, address from, address to, uint256 amount);
    event CrossMint(address token0, address token1, address from, address to, uint256 amount, string txid);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addSupportToken(
        address token0,
        address token1,
        bytes32 _roleFlag
    ) public onlyAdmin {
        require(address(supportToken[token0]) == address(0), "Toke already Supported");
        require(_roleFlag != bytes32(0), "role falg should not bytes32(0)");
        require(roleFlag[token0] == bytes32(0), "role flag already exist");
        supportToken[token0] = IToken(token1);
        roleFlag[token0] = _roleFlag;
    }

    function removeSupportToken(address token0) public onlyAdmin {
        require(address(supportToken[token0]) != address(0), "Toke not Supported");
        delete supportToken[token0];
    }

    function removeRoleFlag(address token0) public onlyAdmin {
        require(roleFlag[token0] != bytes32(0), "roleFlag not Supported");
        delete roleFlag[token0];
    }

    function addSupportTokens(
        address[] memory token0Addrs,
        address[] memory token1Addrs,
        bytes32[] memory _roleFlags
    ) public {
        require(token0Addrs.length == token1Addrs.length, "Token length not match");
        require(token0Addrs.length == _roleFlags.length, "Token length not match");
        for (uint256 i; i < token0Addrs.length; i++) {
            addSupportToken(token0Addrs[i], token1Addrs[i], _roleFlags[i]);
        }
    }

    function removeSupportTokens(address[] memory addrs) public {
        for (uint256 i; i < addrs.length; i++) {
            removeSupportToken(addrs[i]);
            removeRoleFlag(addrs[i]);
        }
    }

    function crossMint(
        address token0,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser(token0) whenNotMinted(txid) onlySupportToken(token0) {
        bool result = _vote(address(supportToken[token0]), from, to, amount, txid);
        if (result) {
            // mint token
            txMinted[txid] = true;
            (uint256 feeAmount, uint256 remainAmount) = calculateFee(token0, amount, 0);
            supportToken[token0].mint(to, remainAmount);
            uint256 feeToLen = feeToLength(token0);
            for (uint256 i; i < feeToLen; i++) {
                supportToken[token0].mint(getFeeTo(token0, i), feeAmount.div(feeToLen));
            }
            emit CrossMint(token0, address(supportToken[token0]), from, to, amount, txid);
        }
    }

    function crossBurn(
        address token0,
        address to,
        uint256 amount
    ) public onlySupportToken(token0) {
        IToken token1 = supportToken[token0];
        require(token1.balanceOf(msg.sender) >= amount, "msg.sender not enough token to burn");

        (uint256 feeAmount, uint256 remainAmount) = calculateFee(token0, amount, 1);
        uint256 feeToLen = feeToLength(token0);
        for (uint256 i; i < feeToLen; i++) {
            token1.transferFrom(msg.sender, getFeeTo(token0, i), feeAmount.div(feeToLen));
        }
        token1.burn(msg.sender, remainAmount);
        emit CrossBurn(token0, address(token1), msg.sender, to, remainAmount);
    }

    function setThreshold(address token1, uint256 _threshold) external onlyAdmin {
        _setThreshold(token1, _threshold);
    }

    function addFeeTo(address token0, address account) external onlyAdmin {
        _addFeeTo(token0, account);
    }

    function removeFeeTo(address token0, address account) external onlyAdmin {
        _removeFeeTo(token0, account);
    }

    function setFee(
        address token0,
        uint256 _lockFeeAmount,
        uint256 _lockFeeRatio,
        uint256 _unlockFeeAmount,
        uint256 _unlockFeeRatio
    ) external onlyAdmin {
        _setFee(token0, _lockFeeAmount, _lockFeeRatio, _unlockFeeAmount, _unlockFeeRatio);
    }

    modifier onlySupportToken(address token0) {
        require(address(supportToken[token0]) != address(0), "Bridge::Not Support Token");
        _;
    }

    modifier onlyCrosser(address token0) {
        require(hasRole(roleFlag[token0], msg.sender), "Bridge::caller is not crosser");
        _;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Bridge::only admin can call");
        _;
    }

    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "tx minted");
        _;
    }
}
