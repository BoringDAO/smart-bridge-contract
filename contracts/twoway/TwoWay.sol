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
import "../ProposalVote.sol";
import "./TwoWayToll.sol";

import "./struct.sol";

contract TwoWay is ProposalVote, AccessControl, TwoWayToll {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Math for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    // tokenInThisChain => mapping(targetChainId=>tokenInTargetChain)
    mapping(address => mapping(uint256 => address)) public supportToken;
    mapping(string => bool) public txMinted;
    mapping(string => bool) public txUnlocked;
    mapping(string => bool) public txRollbacked;

    // token => pair
    mapping(address => address) public pairs;
    // unlock fee actived default
    mapping(address => mapping(uint256 => bool)) public unlockFeeOn;
    // chainid of this blockchain, for chain which not support block.chainid variable
    uint256 public chainid;

    //================= Event ==================//
    // token0 is token in this chain, token1 is token in target chain
    // so 0 represent current chain that the contract be deployed
    event CrossBurn(
        address token0,
        address token1,
        uint256 chainID0,
        uint256 chainID1,
        address from,
        address to,
        uint256 amount
    );
    event Lock(
        address token0,
        address token1,
        uint256 chainID0,
        uint256 chainID1,
        address from,
        address to,
        uint256 amount
    );
    event Unlock(
        address token0,
        address token1,
        uint256 chianID0,
        uint256 chainID1,
        address from,
        address to,
        uint256 amount,
        string txid
    );
    event Rollback(
        address token0,
        address token1,
        uint256 chainID0,
        uint256 chainID1,
        address from,
        address to,
        uint256 amount,
        string txid
    );
    event Rollbacked(address token0, address from, uint256 amount, string txid);
    event CrossIn(
        address token0,
        address token1,
        uint256 chianID0,
        uint256 chainID1,
        address from,
        address to,
        uint256 amount,
        string txid
    );

    constructor(address _feeToDev, uint256 _chainid) TwoWayToll(_feeToDev) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        chainid = _chainid;
    }

    /**
        @param chainId target chainid 
     */
    function setUnlockFeeOn(
        address token0,
        uint256 chainId,
        bool inactived
    ) external onlyAdmin onlySupportToken(token0, chainId) {
        require(unlockFeeOn[token0][chainId] != inactived, "dont need change");
        unlockFeeOn[token0][chainId] = inactived;
    }

    function addPair(
        address token,
        address pair,
        uint256[] memory chainIDs
    ) public onlyAdmin {
        require(pairs[token] == address(0), "token already supported");
        require(pair != address(0), "zero address");
        pairs[token] = pair;
        ISwapPair(pair).addChainIDs(chainIDs);
    }

    function removePair(address token) public onlyAdmin {
        require(pairs[token] != address(0), "token not supported");
        delete pairs[token];
    }

    /**
        add more chain for specfic token 
     */
    function addChainIDs(address token, uint256[] memory chainIDs) external onlyAdmin {
        address pair = pairs[token];
        require(pair != address(0), "not support token");
        ISwapPair(pair).addChainIDs(chainIDs);
    }

    function removeChainIDs(address token, uint256[] memory chainIDs) external onlyAdmin {
        address pair = pairs[token];
        require(pair != address(0), "not support token");
        ISwapPair(pair).removeChainIDs(chainIDs);
    }

    function addLiquidity(
        address token0,
        uint256 amount,
        address to
    ) public returns (uint256 liquidity) {
        address pair = pairs[token0];
        require(pair != address(0), "not soupport pair");
        IERC20(token0).safeTransferFrom(msg.sender, pair, amount);
        liquidity = ISwapPair(pair).mint(to);
    }

    function removeLiquidity(
        address token0,
        uint256 lpAmount,
        address to
    )
        public
        returns (
            uint256 amount0,
            uint256[] memory chainids,
            uint256[] memory amount1s
        )
    {
        require(lpAmount > 0, "zero lp");
        address pair = pairs[token0];
        require(pair != address(0), "not soupport pair");
        uint256 userLiquiBal = IERC20(pair).balanceOf(msg.sender);
        require(userLiquiBal >= lpAmount, "Not enough lp");
        uint256 removeFee = removeFeeAmount[token0];
        (amount0, chainids, amount1s) = ISwapPair(pair).burn(msg.sender, to, lpAmount, feeToDev, removeFee);
        _emitEvent(token0, to, chainids, amount1s);
    }

    function _emitEvent(
        address token0,
        address to,
        uint256[] memory chainids,
        uint256[] memory amount1s
    ) internal {
        for (uint256 i; i < chainids.length; i++) {
            if (amount1s[i] > 0) {
                emit CrossBurn(
                    token0,
                    supportToken[token0][chainids[i]],
                    chainid,
                    chainids[i],
                    msg.sender,
                    to,
                    amount1s[i]
                );
            }
        }
    }

    function getMaxToken1AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = pairs[token0];
        (, uint256 _reserve1) = ISwapPair(pair).getReserves(chainID);

        return _reserve1;
    }

    function getMaxToken0AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = pairs[token0];
        (uint256 _reserve0, ) = ISwapPair(pair).getReserves(chainID);

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
        ISwapPair pair = ISwapPair(pairs[token0]);

        uint256 out = getMaxToken1AmountOut(token0, chainID) / pair.diff0();
        uint256 burnAmount = amount.min(out);
        if (burnAmount > 0) {
            IERC20(token0).safeTransferFrom(msg.sender, address(pair), burnAmount);
            pair.swapOut(to, burnAmount, chainID);
            emit CrossBurn(
                token0,
                supportToken[token0][chainID],
                chainid,
                chainID,
                msg.sender,
                to,
                burnAmount * pair.diff0()
            );
        }
        if (amount > out) {
            IERC20(token0).safeTransferFrom(msg.sender, address(this), amount - burnAmount);
            emit Lock(
                token0,
                supportToken[token0][chainID],
                chainid,
                chainID,
                msg.sender,
                to,
                (amount - burnAmount) * pair.diff0()
            );
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
            address pair = pairs[token0];
            uint256 amountDiffHandle = amount / ISwapPair(pairs[token0]).diff0();
            uint256 token0Amount = getMaxToken0AmountOut(token0, chainID);
            if (amountDiffHandle > token0Amount) {
                emit Rollback(token0, supportToken[token0][chainID], chainid, chainID, from, to, amount, txid);
            } else {
                (uint256 feeAmountFix, , uint256 remainAmount) = calculateFee(token0, chainID, amountDiffHandle);
                SwapInParams memory params = SwapInParams(
                    to,
                    amountDiffHandle,
                    feeAmountFix,
                    remainAmount,
                    feeToDev,
                    chainID
                );
                // ISwapPair(pair).swapIn(to, amountDiffHandle, feeAmountFix, remainAmount, feeToDev, chainID);
                ISwapPair(pair).swapIn(params);
                // emit CrossIn(token0, supportToken[token0][chainID], chainid, chainID, from, to, amountDiffHandle, txid);
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
            IERC20(token0).safeTransfer(from, amount / ISwapPair(pairs[token0]).diff0());
            emit Rollbacked(token0, from, amount / ISwapPair(pairs[token0]).diff0(), txid);
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
        uint256 amountDiffHandle = amount / ISwapPair(pairs[token0]).diff0();
        if (result) {
            txUnlocked[txid] = true;
            if (unlockFeeOn[token0][chainID]) {
                _handleFee(token0, chainID, amountDiffHandle, to);
                ISwapPair(pairs[token0]).update();
            } else {
                IERC20(token0).safeTransfer(to, amountDiffHandle);
            }
            emit Unlock(token0, supportToken[token0][chainID], chainid, chainID, from, to, amountDiffHandle, txid);
        }
    }

    function _handleFee(
        address token0,
        uint256 chainID,
        uint256 amountDiffHandle,
        address to
    ) internal {
        (uint256 feeAmountFix, uint256 feeAmountRatio, uint256 remainAmount) = calculateFee(
            token0,
            chainID,
            amountDiffHandle
        );
        IERC20(token0).safeTransfer(to, remainAmount);
        IERC20(token0).safeTransfer(pairs[token0], feeAmountRatio);
        if (feeAmountFix > 0) {
            IERC20(token0).safeTransfer(feeToDev, feeAmountFix);
        }
    }

    //================ Setter ==================//
    function setThreshold(address token, uint256 _threshold) public onlyAdmin {
        _setThreshold(token, _threshold);
    }

    function addSupportToken(
        address token0,
        address token1,
        uint256 chainID
    ) public onlyAdmin {
        require(supportToken[token0][chainID] == address(0), "TwoWay: Toke already Supported");
        supportToken[token0][chainID] = token1;
        unlockFeeOn[token0][chainID] = true;
    }

    function removeSupportToken(address token0, uint256 chainID) public onlyAdmin {
        require(supportToken[token0][chainID] != address(0), "TwoWay: toke not supported");
        delete supportToken[token0][chainID];
    }

    function addSupportTokens(
        address[] memory token0s,
        address[] memory token1s,
        uint256[] memory chainIDs
    ) public {
        require(token0s.length == token1s.length, "TwoWay: token length not match");
        require(token0s.length == chainIDs.length, "TwoWay: chainIDs length not match");
        for (uint256 i; i < token0s.length; i++) {
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

    function setFee(
        address token0,
        uint256 chainID,
        uint256 feeAmount,
        uint256 feeRatio
    ) public onlyAdmin {
        _setFee(token0, chainID, feeAmount, feeRatio);
    }

    function setFees(
        address[] memory token0s,
        uint256[] memory chainIDs,
        uint256[] memory feeAmounts,
        uint256[] memory feeRatios
    ) external {
        require(token0s.length == chainIDs.length, "len not match");
        require(token0s.length == feeAmounts.length, "len not match");
        require(token0s.length == feeRatios.length, "len not match");
        for (uint i; i < token0s.length; i++) {
            setFee(token0s[i], chainIDs[i], feeAmounts[i], feeRatios[i]);
        }
    }

    function setFeeToDev(address account) external onlyAdmin {
        require(address(0) != account, "zero address");
        _setFeeToDev(account);
    }

    function setRemoveFee(address token0, uint256 _feeAmount) external onlyAdmin {
        _setRemoveFee(token0, _feeAmount);
    }

    //================ Modifier =================//
    modifier onlySupportToken(address token, uint256 chainID) {
        require(supportToken[token][chainID] != address(0), "TwoWay: not support this token");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "TwoWay: caller is not admin");
        _;
    }

    modifier onlyCrosser() {
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
