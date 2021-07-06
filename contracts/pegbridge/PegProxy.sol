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
import "./Toll.sol";

contract PegProxy is ProposalVote, AccessControl, Toll {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Math for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    IPegSwap public pegSwap;
    // mapping(address => address) public supportToken; // eg.ethToken => bscToke
    mapping(address => mapping(uint => address)) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;
    mapping(string => bool) public txRollbacked;

    //================= Event ==================//
    event CrossBurn(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Lock(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Unlock(address token0, address token1, uint256 chianID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollback(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollbacked(address token0, address from, uint256 amount, string txid);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function crossOut(
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token0, chainID) {
        require(amount > 0, "PegProxy: amount must be greater than 0");
        require(to != address(0), "PegProxy: to is empty");

        (uint256 feeAmount, uint256 remainAmount) = calculateFee(token0, chainID, amount);
        uint256 feeToLen = feeToLength(token0, chainID);
        for (uint256 i; i < feeToLen; i++) {
            IERC20(token0).transferFrom(msg.sender, getFeeTo(token0, chainID, i), feeAmount / feeToLen);
        }

        IERC20(token0).transferFrom(msg.sender, address(this), remainAmount);

        uint256 out = pegSwap.getMaxToken1AmountOut(token0, chainID);
        uint256 burnAmount = remainAmount.min(out);
        if (burnAmount > 0) {
            IERC20(token0).approve(address(pegSwap), burnAmount);
            pegSwap.swapToken0ForToken1(token0, chainID, burnAmount, msg.sender);
            burnBoringToken(token0, chainID, to, burnAmount);
        }
        if (amount > out) {
            uint256 lockAmount = remainAmount.sub(burnAmount);
            emit Lock(token0, supportToken[token0][chainID], block.chainid, chainID, msg.sender, to, lockAmount);
        }
    }

    function crossIn(
        address token0,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser whenNotMinted(txid) {
        bool result = _vote(token0, from, to, amount, txid);
        if (result) {
            // mint token
            txMinted[txid] = true;
            address pair = pegSwap.getPair(token0, chainID);
            address borToken = IPegSwapPair(pair).token1();
            uint token0Amount = pegSwap.getMaxToken0AmountOut(token0, chainID);
            if (amount > token0Amount) {
                emit Rollback(token0, supportToken[token0][chainID], block.chainid, chainID, from, to, amount, txid);
            } else {
                IBoringToken(borToken).mint(address(this), amount);
                IBoringToken(borToken).approve(address(pegSwap), amount);
                pegSwap.swapToken1ForToken0(token0, chainID, amount, to);
            }
        }
    }

    function rollback(
        address token0,
        uint256 chainID,
        address from,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token0, chainID) onlyCrosser whenNotRollbacked(txid) {
        bool result = _vote(token0, from, from, amount, txid);
        if (result) {
            txRollbacked[txid] = true;
            IERC20(token0).transfer(from, amount);
            emit Rollbacked(token0, from, amount, txid);
        }
    }

    function unlock(
        address token0,
        uint256 chainID,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token0, chainID) onlyCrosser whenNotUnlocked(txid) {
        bool result = _vote(token0, from, to, amount, txid);
        if (result) {
            txUnlocked[txid] = true;
            IERC20(token0).safeTransfer(to, amount);
            emit Unlock(token0, supportToken[token0][chainID], block.chainid, chainID, from, to, amount, txid);
        }
    }

    function burnBoringToken(
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token0, chainID) {
        address pair = pegSwap.getPair(token0, chainID);
        address token1 = IPegSwapPair(pair).token1();

        require(IERC20(token1).balanceOf(msg.sender) >= amount, "PegProxy: msg.sender not enough token to burn");

        IBoringToken(token1).burn(msg.sender, amount);
        emit CrossBurn(token0, supportToken[token0][chainID], block.chainid, chainID,  msg.sender, to, amount);
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

    //================ Toll =====================//
    function addFeeTo(address token0, uint256 chainID, address account) external onlyAdmin {
        _addFeeTo(token0, chainID, account);
    }

    function removeFeeTo(address token0, uint256 chainID, address account) external onlyAdmin {
        _removeFeeTo(token0, chainID, account);
    }

    function setFee(address token0, uint256 chainID, uint256 feeAmount, uint256 feeRatio) external onlyAdmin {
        _setFee(token0, chainID, feeAmount, feeRatio);
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

    modifier whenNotRollbacked(string memory _txid) {
        require(txRollbacked[_txid] == false, "PegProxy: tx rollbacked");
        _;
    }
}
