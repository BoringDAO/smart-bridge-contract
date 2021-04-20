// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interface/IPegSwap.sol";
import "../interface/IPegSwapPair.sol";
import "../interface/IBoringToken.sol";
import "../ProposalVote.sol";
import "../Toll.sol";

contract PegBridge is ProposalVote, AccessControl, Toll {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Math for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    bool public collectToll;
    address public pegSwap;
    mapping(address => address) public supportToken; // eg.ethToken => bscToke
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;
    mapping(string => bool) public txRollbacked;

    //================= Event ==================//
    event CrossBurn(address srcToken, address destToken, address from, address to, uint256 amount);
    event Lock(address srcToken, address destToken, address from, address to, uint256 amount);
    event Unlock(address srcToken, address destToken, address from, address to, uint256 amount, string txid);
    event Rollback(address srcToken, address destToken, address from, address to, uint256 amount, string txid);

    constructor(
        uint256 _threshold,
        address[] memory _feeTo,
        bool _collectToll
    ) ProposalVote(_threshold) Toll(_feeTo) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        collectToll = _collectToll;
    }

    function crossOut(
        address token,
        address to,
        uint256 amount
    ) public onlySupportToken(token) {
        require(amount > 0, "PegProxy: amount must be greater than 0");
        require(to != address(0), "PegProxy: to is empty");

        uint256 remainAmount = amount;
        if (collectToll) {
            (uint256 feeAmount, uint256 _remainAmount) = calculateFee(amount, 1);
            uint256 feeToLen = feeToLength();
            for (uint256 i; i < feeToLen; i++) {
                IERC20(token).transferFrom(msg.sender, getFeeTo(i), feeAmount.div(feeToLen));
            }
            remainAmount = _remainAmount;
        }

        IERC20(token).transferFrom(msg.sender, address(this), remainAmount);

        uint256 out = IPegSwap(pegSwap).getMaxToken1AmountOut(token);
        uint256 burnAmount = remainAmount.min(out);
        if (burnAmount > 0) {
            IPegSwap(pegSwap).swapToken0ForToken1(token, burnAmount, address(this));
            burnBoringToken(token, to, burnAmount);
        }

        uint256 lockAmount = remainAmount.sub(burnAmount);

        if (lockAmount > 0) {
            lock(token, to, lockAmount);
        }
    }

    function crossIn(
        address token,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser onlySupportToken(token) whenNotMinted(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            // mint token
            txMinted[txid] = true;
            address pair = IPegSwap(pegSwap).getPair(token);
            address token1 = IPegSwapPair(pair).token1();
            uint256 out = IPegSwap(pegSwap).getMaxToken0AmountOut(token);
            if (out < amount) {
                emit Rollback(token, supportToken[token], to, from, amount, txid);
            } else {
                IBoringToken(token1).mint(address(this), amount);

                uint256 remainAmount = amount;
                if (collectToll) {
                    (uint256 feeAmount, uint256 _remainAmount) = calculateFee(amount, 0);
                    uint256 feeToLen = feeToLength();
                    for (uint256 i; i < feeToLen; i++) {
                        IPegSwap(pegSwap).swapToken1ForToken0(token, feeAmount.div(feeToLen), getFeeTo(i));
                    }
                    remainAmount = _remainAmount;
                }
                IPegSwap(pegSwap).swapToken1ForToken0(token, remainAmount, to);
            }
        }
    }

    function rollback(
        address token,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser onlySupportToken(token) whenNotRollbacked(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            IERC20(token).transferFrom(address(this), to, amount);
        }
    }

    function lock(
        address token,
        address to,
        uint256 amount
    ) internal {
        // IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Lock(token, supportToken[token], msg.sender, to, amount);
    }

    function unlock(
        address token,
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlySupportToken(token) onlyCrosser whenNotUnlocked(txid) {
        bool result = _vote(token, from, to, amount, txid);
        if (result) {
            txUnlocked[txid] = true;

            uint256 remainAmount = amount;
            if (collectToll) {
                (uint256 feeAmount, uint256 _remainAmount) = calculateFee(amount, 0);
                uint256 feeToLen = feeToLength();
                for (uint256 i; i < feeToLen; i++) {
                    IERC20(token).safeTransfer(getFeeTo(i), feeAmount.div(feeToLen));
                }
                remainAmount = _remainAmount;
            }

            IERC20(token).safeTransfer(to, remainAmount);
            emit Unlock(token, supportToken[token], from, to, amount, txid);
        }
    }

    function burnBoringToken(
        address token,
        address to,
        uint256 amount
    ) public onlySupportToken(token) {
        address pair = IPegSwap(pegSwap).getPair(token);
        address token1 = IPegSwapPair(pair).token1();

        require(IERC20(token1).balanceOf(msg.sender) >= amount, "PegProxy: msg.sender not enough token to burn");

        IBoringToken(token1).burn(msg.sender, amount);
        emit CrossBurn(token, supportToken[token], msg.sender, to, amount);
    }

    //================ Setter ==================//
    function addFeeTo(address account) external onlyAdmin {
        _addFeeTo(account);
    }

    function removeFeeTo(address account) external onlyAdmin {
        _removeFeeTo(account);
    }

    function setFee(
        uint256 _lockFeeAmount,
        uint256 _lockFeeRatio,
        uint256 _unlockFeeAmount,
        uint256 _unlockFeeRatio
    ) external onlyAdmin {
        _setFee(_lockFeeAmount, _lockFeeRatio, _unlockFeeAmount, _unlockFeeRatio);
    }

    function setThreshold(uint256 _threshold) public onlyAdmin {
        _setThreshold(_threshold);
    }

    function setPegSwap(address _pegSwap) public onlyAdmin {
        pegSwap = _pegSwap;
    }

    function addSupportToken(address ethTokenAddr, address bscTokenAddr) public onlyAdmin {
        require(supportToken[ethTokenAddr] == address(0), "PegProxy: Toke already Supported");
        supportToken[ethTokenAddr] = bscTokenAddr;
    }

    function removeSupportToken(address ethTokenAddr) public onlyAdmin {
        require(supportToken[ethTokenAddr] != address(0), "PegProxy: toke not supported");
        delete supportToken[ethTokenAddr];
    }

    function addSupportTokens(address[] memory ethTokenAddrs, address[] memory bscTokenAddrs) public {
        require(ethTokenAddrs.length == bscTokenAddrs.length, "PegProxy: token length not match");
        for (uint256 i; i < ethTokenAddrs.length; i++) {
            addSupportToken(ethTokenAddrs[i], bscTokenAddrs[i]);
        }
    }

    function removeSupportTokens(address[] memory ethTokenAddrs) public {
        for (uint256 i; i < ethTokenAddrs.length; i++) {
            removeSupportToken(ethTokenAddrs[i]);
        }
    }

    //================ Modifier =================//
    modifier onlySupportToken(address token) {
        require(supportToken[token] != address(0), "PegProxy: not support this token");
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
