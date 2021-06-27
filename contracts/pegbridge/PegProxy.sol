// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interface/IPegSwap.sol";
import "../interface/IPegSwapPair.sol";
import "../interface/IBoringToken.sol";
import "../ProposalVote.sol";

contract PegProxy is ProposalVote, AccessControl {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Math for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    IPegSwap public pegSwap;
    // mapping(address => address) public supportToken; // eg.ethToken => bscToke
    mapping(address => mapping(uint => address)) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;

    //================= Event ==================//
    event CrossBurn(address srcToken, address destToken, uint chainID, address from, address to, uint256 amount);
    event Lock(address srcToken, address destToken, uint256 chainID,  address from, address to, uint256 amount);
    event Unlock(address srcToken, address destToken, uint256 chianID, address from, address to, uint256 amount, string txid);
    event Rollback(address srcToken, address destToken, uint256 chainID, address from, address to, uint256 amount, string txid);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function crossOut(
        address token,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token, chainID) {
        require(amount > 0, "PegProxy: amount must be greater than 0");
        require(to != address(0), "PegProxy: to is empty");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 out = pegSwap.getMaxToken1AmountOut(token, chainID);
        uint256 burnAmount = amount.min(out);
        pegSwap.swapToken0ForToken1(token, chainID, burnAmount, address(this));
        burnBoringToken(token, chainID, to, burnAmount);
        if (amount > out) {
            uint256 lockAmount = amount.sub(burnAmount);
            lock(token, chainID, to, lockAmount);
        }
    }

    function crossIn(
        address token,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser whenNotMinted(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            // mint token
            txMinted[txid] = true;
            address pair = pegSwap.getPair(token, chainID);
            address token1 = IPegSwapPair(pair).token1();
            uint token0Amount = pegSwap.getMaxToken0AmountOut(token, chainID);
            if (amount > token0Amount) {
                emit Rollback(token, token1, chainID, from, to, amount, txid);
            } else {
                IBoringToken(token1).mint(address(this), amount);
                pegSwap.swapToken1ForToken0(token, chainID, amount, to);
            }
        }
    }

    // 1. fee dynamicly
    // 2.
    function rollback() public {}

    function lock(
        address token,
        uint256 chainID,
        address to,
        uint256 amount
    ) internal {
        // IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Lock(token, supportToken[token][chainID], chainID, msg.sender, to, amount);
    }

    function unlock(
        address token,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token, chainID) onlyCrosser whenNotUnlocked(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            txUnlocked[txid] = true;
            IERC20(token).safeTransfer(to, amount);
            emit Unlock(token, supportToken[token][chainID], chainID, from, to, amount, txid);
        }
    }

    function burnBoringToken(
        address token,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token, chainID) {
        address pair = pegSwap.getPair(token, chainID);
        address token1 = IPegSwapPair(pair).token1();

        require(IERC20(token1).balanceOf(msg.sender) >= amount, "PegProxy: msg.sender not enough token to burn");

        IBoringToken(token1).burn(msg.sender, amount);
        emit CrossBurn(token, supportToken[token][chainID], chainID,  msg.sender, to, amount);
    }

    //================ Setter ==================//
    function setThreshold(address token, uint256 _threshold) public onlyAdmin {
        _setThreshold(token, _threshold);
    }

    function setPegSwap(address _pegSwap) public onlyAdmin {
        pegSwap = IPegSwap(_pegSwap);
    }

    function addSupportToken(address token0, address token1, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] == address(0), "PegProxy: Toke already Supported");
        supportToken[token0][chainID] = token1;
    }

    function removeSupportToken(address token0, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] != address(0), "PegProxy: toke not supported");
        delete supportToken[token0][chainID];
    }

    function addSupportTokens(address[] memory token0s, address[] memory token1s, uint256[] memory chainIDs) public {
        require(token0s.length == token1s.length, "PegProxy: token length not match");
        require(token0s.length == chainIDs.length, "PegProxy: chainIDs length not match");
        for (uint256 i; i <token0s.length; i++) {
            addSupportToken(token0s[i], token1s[i], chainIDs[i]);
        }
    }

    function removeSupportTokens(address[] memory token0s, uint256[] memory chainIDs) public {
        require(token0s.length == chainIDs.length, "PegProxy: chainIDs length not match");
        for (uint256 i; i < token0s.length; i++) {
            removeSupportToken(token0s[i], chainIDs[i]);
        }
    }

    //================ Modifier =================//
    modifier onlySupportToken(address token, uint256 chainID) {
        require(supportToken[token][chainID] != address(0), "PegProxy: not support this token");
        _;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "PegProxy: caller is not admin");
        _;
    }

    modifier onlyCrosser {
        require(hasRole(CROSSER_ROLE, msg.sender), "PegProxy: caller is not crosser");
        _;
    }

    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "PegProxy: tx minted");
        _;
    }

    modifier whenNotUnlocked(string memory _txid) {
        require(txUnlocked[_txid] == false, "PegProxy: tx unlocked");
        _;
    }
}
