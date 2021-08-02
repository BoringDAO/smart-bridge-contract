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
    mapping(address => mapping(uint => address)) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;
    mapping(string => bool) public txRollbacked;

    ITwoWayFeePool public twoWayFeePool;

    mapping(address => mapping(uint256 => address)) public pairs;
    mapping(address => uint256) removalMinimum;

    //================= Event ==================//
    event CrossBurn(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Lock(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount);
    event Unlock(address token0, address token1, uint256 chianID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollback(address token0, address token1, uint256 chainID0, uint256 chainID1, address from, address to, uint256 amount, string txid);
    event Rollbacked(address token0, address from, uint256 amount, string txid);

    constructor(address _feeToDev) TwoWayToll(_feeToDev) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // view
    // todo
    function getPair(address token, uint256 chainID) public view onlySupportToken(token, chainID) returns(address) {
        return pairs[token][chainID];
    }

    function addPair(address token, address pair, uint256 chainID) public onlyAdmin {
        require(pairs[token][chainID] == address(0), "token already supported");
        pairs[token][chainID] = pair;
    }

    function setRemovalMinimum(address token0, uint256 minimum) public onlyAdmin {
        removalMinimum[token0] = minimum;
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
        uint256 liquidity,
        address to
    ) public onlySupportToken(token0, chainID) returns (uint256 amount0, uint256 amount1) {
        require(removalMinimum[token0] < liquidity, "liquidity is less than minimum");
        address pair = pairs[token0][chainID];
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (amount0, amount1) = ISwapPair(pair).burn(msg.sender);
        (uint removeFeeAmount,) = calculateRemoveFee(token0, chainID, amount0);

        if (removeFeeAmount > 0) {
            IERC20(token0).safeTransferFrom(msg.sender, feeToDev, removeFeeAmount);
        }

        if (amount1 > 0) {
            burnBoringToken(msg.sender, token0, chainID, to, amount1);
        }
    }

    // token0 -> token1
    function swapToken0ForToken1(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) internal onlySupportToken(token0, chainID) {
        require(amountIn > 0, "input must be greater than 0");
        address pair = pairs[token0][chainID];

        // transfer erc20 token to pair address
        IERC20(token0).safeTransferFrom(msg.sender, pair, amountIn);
        ISwapPair(pair).swap(to, true);
    }

    function swapToken1ForToken0(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) internal onlySupportToken(token0, chainID) {
        require(amountIn > 0, "input must be greater than 0");
        address pair = pairs[token0][chainID];
        address token1 = ISwapPair(pair).token1();

        // transfer bor-erc20 token to pair address
        IERC20(token1).safeTransferFrom(msg.sender, pair, amountIn);
        ISwapPair(pair).swap(to, false);
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
        require(amount > 0, "PegProxy: amount must be greater than 0");
        require(to != address(0), "PegProxy: to is empty");

        (uint256 feeAmountFix, uint256 feeAmountRatio, uint256 remainAmount) = calculateFee(token0, chainID, amount);
        IERC20(token0).safeTransferFrom(msg.sender, feeTo[token0][chainID], feeAmountRatio);
        twoWayFeePool.notify(feeAmountRatio);

        if (feeAmountFix > 0) {
            IERC20(token0).safeTransferFrom(msg.sender, feeToDev, feeAmountFix);
        }

        IERC20(token0).safeTransferFrom(msg.sender, address(this), remainAmount);

        uint256 out = getMaxToken1AmountOut(token0, chainID);
        uint256 burnAmount = remainAmount.min(out);
        if (burnAmount > 0) {
            swapToken0ForToken1(token0, chainID, burnAmount, msg.sender);
            _burnBoringToken(msg.sender, token0, chainID, to, burnAmount);
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
            address pair = pairs[token0][chainID];
            address borToken = ISwapPair(pair).token1();
            uint token0Amount = getMaxToken0AmountOut(token0, chainID);
            if (amount > token0Amount) {
                emit Rollback(token0, supportToken[token0][chainID], block.chainid, chainID, from, to, amount, txid);
            } else {
                IBoringToken(borToken).mint(address(this), amount);
                swapToken1ForToken0(token0, chainID, amount, to);
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

    function _burnBoringToken(
        address sender,
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) internal {
        address pair = pairs[token0][chainID];
        address token1 = ISwapPair(pair).token1();

        require(IERC20(token1).balanceOf(sender) >= amount, "msg.sender not enough token to burn");

        IBoringToken(token1).burn(sender, amount);
        emit CrossBurn(token0, supportToken[token0][chainID], block.chainid, chainID,  sender, to, amount);
    }


    function burnBoringToken(
        address sender,
        address token0,
        uint256 chainID,
        address to,
        uint256 amount
    ) public onlySupportToken(token0, chainID) {
        _burnBoringToken(sender, token0, chainID, to, amount);
    }

    //================ Setter ==================//
    function setThreshold(address token, uint256 _threshold) public onlyAdmin {
        _setThreshold(token, _threshold);
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
    function setFeeTo(address token0, uint256 chainID, address account) external onlyAdmin {
        _setFeeTo(token0, chainID, account);
    }

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
