// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interface/ISwapPair.sol";
import "../interface/IBoringToken.sol";
import "../interface/ITwoWayFeePool.sol";
import "../ProposalVote.sol";
import "./TwoWayToll.sol";

contract TwoWay is ProposalVote, AccessControl, TwoWayToll {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Math for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    // mapping(address => address) public supportToken; // eg.ethToken => bscToke
    mapping(address => mapping(uint256 => address)) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;
    mapping(string => bool) public txRollbacked;

    ITwoWayFeePool public twoWayFeePool;

    mapping(address => mapping(uint256 => address)) public pairs;

    //================= Event ==================//
    event CrossBurn(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Lock(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Unlock(address token0, address token1, uint256 chianID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollback(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollbacked(address token0, address from, uint256 amount, string txid);

    constructor(address _feeToDev) TwoWayToll(_feeToDev) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTwoWayFeePool(address _feePool) external onlyAdmin {
        twoWayFeePool = ITwoWayFeePool(_feePool);
    }

    function addPair(address token, address pair, uint256 chainID) public onlyAdmin {
        require(pairs[token][chainID] == address(0), "token already supported");
        pairs[token][chainID] = pair;
    }

    function removePair(address token, uint256 chainID) public onlyAdmin {
        require(pairs[token][chainID] != address(0), "token not supported");
        delete pairs[token][chainID];
    }

    function addLiquidity(
        address token0,
        uint256 chainID,
        uint256 amount,
        address to
    ) public onlySupportToken(token0, chainID) returns (uint256 liquidity) {
        address pair = pairs[token0][chainID];
        IERC20(token0).safeTransferFrom(msg.sender, pair, amount);
        liquidity = ISwapPair(pair).mint(to);
    }

    function removeLiquidity(
        address token0,
        uint256 chainID,
        uint256 lpAmount,
        address to
    ) public onlySupportToken(token0, chainID) returns (uint256 amount0, uint256 amount1) {
        address pair = pairs[token0][chainID];
        uint userLiquiBal = IERC20(pair).balanceOf(msg.sender);
        require(userLiquiBal >= lpAmount, "Not enough lp");
        uint removeFee = removeFeeAmount[token0][chainID];
        (amount0, amount1) = ISwapPair(pair).burn(msg.sender, to, lpAmount, feeToDev, removeFee);
        if (amount1 > 0) {
            emit CrossBurn(token0, supportToken[token0][chainID], block.chainid, chainID,  msg.sender, to, amount1);
        }
    }

    function getMaxToken1AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = pairs[token0][chainID];
        (, uint256 _reserve1) = ISwapPair(pair).getReserves();

        return _reserve1;
    }

    function getMaxToken0AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = pairs[token0][chainID];
        (uint256 _reserve0, ) = ISwapPair(pair).getReserves();

        return _reserve0;
    }

    function crossOut(
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token0, chainID) {
        require(amount > 0, "TwoWay: amount must be greater than 0");
        require(to != address(0), "TwoWay: to is empty");
        address pair = pairs[token0][chainID];

        IERC20(token0).safeTransferFrom(msg.sender, pair, amount);

        uint256 out = getMaxToken1AmountOut(token0, chainID);
        uint256 burnAmount = amount.min(out);
        if (burnAmount > 0) {
            ISwapPair(pair).swapOut(to, burnAmount);
            emit CrossBurn(token0, pair, block.chainid, chainID, msg.sender, to, burnAmount);
        }
        if (amount > out) {
            emit Lock(token0, supportToken[token0][chainID], block.chainid, chainID, msg.sender, to, amount-burnAmount);
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
            address pair = pairs[token0][chainID];
            (uint feeAmountFix, , uint remainAmount) = calculateFee(token0, chainID, amount);
            uint token0Amount = getMaxToken0AmountOut(token0, chainID);
            if (amount > token0Amount) {
                emit Rollback(token0, supportToken[token0][chainID], block.chainid, chainID, from, to, amount, txid);
            } else {
                ISwapPair(pair).swapIn(to, amount, feeAmountFix, remainAmount, feeToDev);
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
            IERC20(token0).safeTransfer(from, amount);
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

    //================ Setter ==================//
    function setThreshold(address token, uint256 _threshold) public onlyAdmin {
        _setThreshold(token, _threshold);
    }

    function addSupportToken(address token0, address token1, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] == address(0), "TwoWay: Toke already Supported");
        supportToken[token0][chainID] = token1;
    }

    function removeSupportToken(address token0, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] != address(0), "TwoWay: toke not supported");
        delete supportToken[token0][chainID];
    }

    function addSupportTokens(address[] memory token0s, address[] memory token1s, uint256[] memory chainIDs) public {
        require(token0s.length == token1s.length, "TwoWay: token length not match");
        require(token0s.length == chainIDs.length, "TwoWay: chainIDs length not match");
        for (uint256 i; i <token0s.length; i++) {
            addSupportToken(token0s[i], token1s[i], chainIDs[i]);
        }
    }

    function removeSupportTokens(address[] memory token0s, uint256[] memory chainIDs) public {
        require(token0s.length == chainIDs.length, "TwoWay: chainIDs length not match");
        for (uint256 i; i < token0s.length; i++) {
            removeSupportToken(token0s[i], chainIDs[i]);
        }
    }

    //================ Toll =====================//

    function setFee(address token0, uint256 chainID, uint256 feeAmount, uint256 feeRatio) external onlyAdmin {
        _setFee(token0, chainID, feeAmount, feeRatio);
    }

    function setFeeToDev(address account) external {
        _setFeeToDev(account);
    }

    function setRemoveFee(address token0, uint256 chainID, uint256 _feeAmount) external onlyAdmin {
        _setRemoveFee(token0, chainID, _feeAmount);
    }

    //================ Modifier =================//
    modifier onlySupportToken(address token, uint256 chainID) {
        require(supportToken[token][chainID] != address(0), "TwoWay: not support this token");
        _;
    }

    modifier onlyAdmin {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "TwoWay: caller is not admin");
        _;
    }

    modifier onlyCrosser {
        require(hasRole(CROSSER_ROLE, msg.sender), "TwoWay: caller is not crosser");
        _;
    }

    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "TwoWay: tx minted");
        _;
    }

    modifier whenNotUnlocked(string memory _txid) {
        require(txUnlocked[_txid] == false, "TwoWay: tx unlocked");
        _;
    }

    modifier whenNotRollbacked(string memory _txid) {
        require(txRollbacked[_txid] == false, "TwoWay: tx rollbacked");
        _;
    }
}
