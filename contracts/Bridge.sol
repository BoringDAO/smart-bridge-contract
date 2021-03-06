// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/IToken.sol";
import "./ProposalVote.sol";
import "./Toll.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Bridge is Initializable, UUPSUpgradeable, ProposalVote, Toll, AccessControlUpgradeable {
    uint256 public chainID;
    // eg.ethToken => other
    mapping(address => IToken) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(address => uint256) public minBurn;

    event CrossBurn(address token0, address token1, uint256 chainID, address from, address to, uint256 amount);
    event CrossMint(
        address token0,
        address token1,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string txid
    );
    event MinBurnChanged(address token1, uint256 preMin, uint256 nowMin);

    function initialize(uint256 _chainID) public initializer {
        chainID = _chainID;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function getRoleKey(address token0, address token1) public view returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(token0, token1, chainID));
        return key;
    }

    function addSupportToken(address token0, address token1) public onlyAdmin {
        require(address(supportToken[token0]) == address(0), "Toke already Supported");
        require(address(0) != token1, "zero address");
        supportToken[token0] = IToken(token1);
    }

    function removeSupportToken(address token0) public onlyAdmin {
        require(address(supportToken[token0]) != address(0), "Toke not Supported");
        delete supportToken[token0];
    }

    function addSupportTokens(address[] memory token0Addrs, address[] memory token1Addrs) public {
        require(token0Addrs.length == token1Addrs.length, "Token length not match");
        for (uint256 i; i < token0Addrs.length; i++) {
            addSupportToken(token0Addrs[i], token1Addrs[i]);
        }
    }

    function removeSupportTokens(address[] memory addrs) public {
        for (uint256 i; i < addrs.length; i++) {
            removeSupportToken(addrs[i]);
        }
    }

    function crossMint(
        address token0,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token0) onlyCrosser(token0) whenNotMinted(txid) {
        bool result = _vote(address(supportToken[token0]), from, to, amount, txid);
        if (result) {
            // mint token
            txMinted[txid] = true;
            (uint256 feeAmount, uint256 remainAmount) = calculateFee(token0, amount, 0);
            supportToken[token0].mint(to, remainAmount);
            _mintToFeeTo(token0, feeAmount);
            emit CrossMint(token0, address(supportToken[token0]), chainID, from, to, amount, txid);
        }
    }

    function _mintToFeeTo(address token0, uint256 feeAmount) internal {
        uint256 feeToLen = feeToLength(token0);
        for (uint256 i; i < feeToLen; i++) {
            address feeTo = getFeeTo(token0, i);
            supportToken[token0].mint(feeTo, feeAmount / feeToLen);
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
            token1.transferFrom(msg.sender, getFeeTo(token0, i), feeAmount / feeToLen);
        }
        token1.burn(msg.sender, remainAmount);
        emit CrossBurn(token0, address(token1), chainID, msg.sender, to, remainAmount);
    }

    function setMinBurn(address token1, uint256 amount) public onlyAdmin {
        uint256 preMin = minBurn[token1];
        minBurn[token1] = amount;
        emit MinBurnChanged(token1, preMin, amount);
    }

    function setThreshold(address token1, uint256 _threshold) external onlyAdmin {
        _setThreshold(token1, _threshold);
    }

    function addFeeTo(address token0, address account) external onlyAdmin {
        require(address(0) != account, "zero address");
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
        bytes32 key = getRoleKey(token0, address(supportToken[token0]));
        require(hasRole(key, msg.sender), "Bridge::caller is not crosser");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Bridge::only admin can call");
        _;
    }

    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "tx minted");
        _;
    }
}
