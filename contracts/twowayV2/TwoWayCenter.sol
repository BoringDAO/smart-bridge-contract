// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./TwoWayProposalVote.sol";
import "../interface/IToken.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TwParams.sol";
import "../lib/SafeDecimalMath.sol";
import "../interface/IStakingReward.sol";

/// @notice center chain is also a special edge chain
contract TwoWayCenter is Initializable, AccessControlUpgradeable, UUPSUpgradeable, TwoWayProposalVote {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeDecimalMath for uint256;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public chainId;
    address public feeTo;
    address public treasuryTo;
    IStakingReward public sr;
    /// @notice centerToken is oToken which issue by boringDAO.
    /// @notice edge chain's chainId => edge chain token => oToken
    mapping(uint256 => mapping(address => address)) public toCenterToken;
    /// @notice oToken => edge chainid => edgeChain token
    mapping(address => mapping(uint256 => address)) public toEdgeToken;
    /// edge token in center chian
    mapping(address => uint256) public decimalDiff;
    mapping(string => bool) public txHandled;
    /// @notice token => account => bool
    mapping(address => mapping(address => bool)) public isInWhilelist;
    /// @notice oToken => edge chainid => amount
    mapping(address => mapping(uint256 => uint256)) public fixFees;
    // oToken => edgeChainId => amount
    mapping(address => mapping(uint256 => uint256)) public lockBalances;
    mapping(address => mapping(uint256 => uint256)) public ratioFeesHigh;
    mapping(address => mapping(uint256 => uint256)) public ratioFeesMedium;
    mapping(address => mapping(uint256 => uint256)) public ratioFeesLow;
    /// oToken => amount
    mapping(address => uint256) public remainHigh;
    mapping(address => uint256) public remainLow;
    /// oToken => stakingReward
    mapping(address => address) public srs;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        uint256 _chainId,
        address _feeTo,
        address _treasuryTo
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        chainId = _chainId;
        feeTo = _feeTo;
        treasuryTo = _treasuryTo;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function addToken(
        address _centerToken,
        uint256 _edgeChainId,
        address _edgeToken
    ) external onlyAdmin {
        require(toCenterToken[_edgeChainId][_edgeToken] == address(0), "centerToken exist");
        require(toEdgeToken[_centerToken][_edgeChainId] == address(0), "edgeToken exist");
        toCenterToken[_edgeChainId][_edgeToken] = _centerToken;
        toEdgeToken[_centerToken][_edgeChainId] = _edgeToken;
        if (_edgeChainId == chainId) {
            decimalDiff[_edgeToken] = 10**(18 - IERC20MetadataUpgradeable(_edgeToken).decimals());
        }
    }

    function removeToken(
        address _centerToken,
        uint256 _edgeChainId,
        address _edgeToken
    ) external onlyAdmin {
        require(toCenterToken[_edgeChainId][_edgeToken] != address(0), "centerToken not exist");
        require(toEdgeToken[_centerToken][_edgeChainId] != address(0), "edgeToken not exist");
        delete toCenterToken[_edgeChainId][_edgeToken];
        delete toEdgeToken[_centerToken][_edgeChainId];
    }

    function setStakingRewards(address[] memory oTokens, address[] memory _srs) external onlyAdmin {
        require(oTokens.length == _srs.length, "not match");
        for (uint i; i < oTokens.length; i++) {
            require(oTokens[i] != address(0), "zero address");
            require(_srs[i] != address(0), "zero address");
            srs[oTokens[i]] = _srs[i];
        }
    }

    function resetStakingReward(address _oToken) external onlyAdmin {
        delete srs[_oToken];
        emit StakingRewardReseted(_oToken);
    }

    /// @param token oToken address
    function setFee(
        address token,
        uint256[] memory toChainIds,
        uint256[] memory _fixFees,
        uint256[] memory _ratioFeesHigh,
        uint256[] memory _ratioFeesMedium,
        uint256[] memory _ratioFeesLow,
        uint256[] memory _remains
    ) external onlyAdmin {
        require(toChainIds.length == _fixFees.length, " toChainId not match");
        require(_ratioFeesHigh.length == _fixFees.length, " ratioFee not match");
        require(_ratioFeesMedium.length == _fixFees.length, " ratioFee not match");
        require(_ratioFeesLow.length == _fixFees.length, " ratioFee not match");
        require(_remains.length == 2, "ramins not match");
        for (uint256 i; i < toChainIds.length; i++) {
            fixFees[token][toChainIds[i]] = _fixFees[i];
            ratioFeesHigh[token][toChainIds[i]] = _ratioFeesHigh[i];
            ratioFeesMedium[token][toChainIds[i]] = _ratioFeesMedium[i];
            ratioFeesLow[token][toChainIds[i]] = _ratioFeesLow[i];
        }
        remainHigh[token] = _remains[0];
        remainLow[token] = _remains[1];
    }

    function setFeeTo(address _feeTo) external onlyAdmin {
        require(_feeTo != address(0), "zero address");
        feeTo = _feeTo;
    }

    function setTreasuryTo(address _treasuryTo) external onlyAdmin {
        require(_treasuryTo != address(0), "zero address");
        treasuryTo = _treasuryTo;
    }

    function setWhitelist(address oToken, address user, bool _isInWhitelist) external onlyAdmin {
        require(isInWhilelist[oToken][user] != _isInWhitelist, "error state");
        isInWhilelist[oToken][user] = _isInWhitelist;
    }

    /// @param token0 OToken address
    function setThreshold(address token0, uint256 _threshold) external onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function deposit(address token, uint256 amount) external {
        address centerToken = toCenterToken[chainId][token];
        require(centerToken != address(0), "not support");
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        IToken(centerToken).mint(msg.sender, amount * decimalDiff[token]);
        lockBalances[centerToken][chainId] += amount * decimalDiff[token];
        emit Deposited(chainId, token, msg.sender, amount * decimalDiff[token]);
    }

    function crossOut(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
        require(toChainId != chainId, "toChainId error");
        address _centerToken = toCenterToken[chainId][fromToken];
        require(_centerToken != address(0), "not support");
        address _edgeToken = toEdgeToken[_centerToken][toChainId];
        require(_edgeToken != address(0), "not support");
        require(lockBalances[_centerToken][toChainId] >= amount * decimalDiff[fromToken], "not enough liqui");
        // transfer
        IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        // fee
        (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(
            _centerToken,
            toChainId,
            amount * decimalDiff[fromToken]
        );
        _handleFeeByMint(_centerToken, fixAmount, ratioAmount);
        // lock state
        lockBalances[_centerToken][chainId] += amount * decimalDiff[fromToken];
        lockBalances[_centerToken][toChainId] -= remainAmount;

        emit CrossOuted(InParam(chainId, fromToken, msg.sender, toChainId, _edgeToken, to, remainAmount));
    }

    function _handleFeeByMint(
        address centerToken,
        uint256 fixAmount,
        uint256 ratioAmount
    ) internal {
        if (fixAmount > 0) {
            IToken(centerToken).mint(feeTo, fixAmount);
        }
        if (ratioAmount > 0) {
            if (srs[centerToken] == address(0)) {
                IToken(centerToken).mint(treasuryTo, ratioAmount);
            } else {
                uint halfFee = ratioAmount / 2;
                IToken(centerToken).mint(treasuryTo, halfFee);
                IToken(centerToken).mint(srs[centerToken], halfFee);
                IStakingReward(srs[centerToken]).notifyRewardAmount(halfFee, 24 * 3600);
            }
        }
    }

    function forwardCrossOut(OutParam memory p, string memory txid)
        external
        onlyCrosser(toCenterToken[p.fromChainId][p.fromToken])
        whenNotHandled(txid)
    {   
        require(p.fromChainId != p.toChainId, "chainId error");
        address centerToken = toCenterToken[p.fromChainId][p.fromToken];
        require(centerToken != address(0), "not support centerToken");
        address edgeToken = toEdgeToken[centerToken][p.toChainId];
        require(edgeToken != address(0), "not support edgeToken");
        bool result = _vote(p.fromChainId, centerToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;

            lockBalances[centerToken][p.fromChainId] += p.amount;

            if (lockBalances[centerToken][p.toChainId] >= p.amount) {
                (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(
                    centerToken,
                    p.toChainId,
                    p.amount
                );
                _handleFeeByMint(centerToken, fixAmount, ratioAmount);
                lockBalances[centerToken][p.toChainId] -= remainAmount;
                emit ForwardCrossOuted(
                    InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, remainAmount)
                );
            } else {
                IToken(centerToken).mint(p.to, p.amount);
                emit ForwardCrossOutFailed(
                    InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, p.amount)
                );
            }
        }
    }

    function crossIn(OutParam memory p, string memory txid)
        external
        onlyCrosser(toCenterToken[p.fromChainId][p.fromToken])
        whenNotHandled(txid)
    {
        require(p.toChainId == chainId, "chainId error");
        address centerToken = toCenterToken[p.fromChainId][p.fromToken];
        address edgeToken = toEdgeToken[centerToken][p.toChainId];
        require(centerToken != address(0), "centerToken not support");
        require(edgeToken != address(0), "edgeToken not support");
        bool result = _vote(p.fromChainId, centerToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            lockBalances[centerToken][p.fromChainId] += p.amount;
            if (lockBalances[centerToken][chainId] >= p.amount) {
                // fee
                (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(
                    centerToken,
                    p.toChainId,
                    p.amount
                );
                // transfer
                IERC20Upgradeable(edgeToken).safeTransfer(p.to, remainAmount / decimalDiff[edgeToken]);
                _handleFeeByMint(centerToken, fixAmount, ratioAmount);
                lockBalances[centerToken][p.toChainId] -= remainAmount;
                emit CrossIned(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, remainAmount));
            } else {
                IToken(centerToken).mint(p.to, p.amount);
                emit CrossInFailed(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, p.amount));
            }
        }
    }

    function issue(InParam memory p, string memory txid)
        external
        onlyCrosser(toCenterToken[p.fromChainId][p.fromToken])
        whenNotHandled(txid)
    {
        require(p.toChainId == chainId, "chainId not match");
        address _centerToken = toCenterToken[p.fromChainId][p.fromToken];
        require(_centerToken != address(0), "centerToken exist");
        require(toEdgeToken[_centerToken][p.fromChainId] != address(0), "edgeToken exist");

        bool result = _vote(p.fromChainId, _centerToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            IToken(_centerToken).mint(p.to, p.amount);
            lockBalances[_centerToken][p.fromChainId] += p.amount;
            emit Issued(p);
        }
    }

    /// @param oToken oToken on CenterChain
    /// @param amount amount of fromToken
    function withdraw(
        address oToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
        require(lockBalances[oToken][toChainId] >= amount, "not enough liqui");
        address _edgeToken = toEdgeToken[oToken][toChainId];
        require(_edgeToken != address(0), "edge toke not support");
        // fee
        (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(oToken, toChainId, amount);
        _handleFeeByMint(oToken, fixAmount, ratioAmount);
        
        IToken(oToken).burn(msg.sender, amount);
        lockBalances[oToken][toChainId] -= amount;
        if (toChainId == chainId) {
            IERC20Upgradeable(_edgeToken).safeTransfer(msg.sender, remainAmount / decimalDiff[_edgeToken]);
            emit WithdrawedToCenter(InParam(chainId, oToken, msg.sender, toChainId, _edgeToken, to, remainAmount));
        } else {
            emit Withdrawed(InParam(chainId, oToken, msg.sender, toChainId, _edgeToken, to, remainAmount));
        }
    }

    function calculateFee(
        address oToken,
        uint256 toChainId,
        uint256 amount
    )
        public
        view
        returns (
            uint256 fixAmount,
            uint256 ratioAmount,
            uint256 remainAmount
        )
    {
        if (isInWhilelist[oToken][msg.sender]) {
            return (fixAmount, ratioAmount, amount);
        }
        uint256 _ratioFee;
        uint256 r;
        uint256 lock = lockBalances[oToken][toChainId];
        if (amount > lock) {
            _ratioFee = ratioFeesLow[oToken][toChainId];
        } else {
            r = lock - amount;
        }
        if (r <= remainLow[oToken]) {
            _ratioFee = ratioFeesHigh[oToken][toChainId];
        } else if (r > remainLow[oToken] && r <= remainHigh[oToken]) {
            _ratioFee = ratioFeesMedium[oToken][toChainId];
        } else {
            _ratioFee = ratioFeesLow[oToken][toChainId];
        }
        fixAmount = fixFees[oToken][toChainId];
        uint256 r1 = amount - fixAmount;
        ratioAmount = _ratioFee.multiplyDecimal(r1);
        remainAmount = amount - fixAmount - ratioAmount;
    }

    function getRoleKey(address toToken) public pure returns (bytes32 key) {
        key = keccak256(abi.encodePacked(toToken));
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "TwoWay: caller is not admin");
        _;
    }

    modifier onlyCrosser(address toToken) {
        bytes32 key = getRoleKey(toToken);
        require(hasRole(key, msg.sender), "TwoWay: caller is not crosser");
        _;
    }

    modifier whenNotHandled(string memory _txid) {
        require(txHandled[_txid] == false, "TwoWay: tx minted");
        _;
    }

    function getMsgSender() external view returns (address, address) {
        return (msg.sender, msg.sender);
    }

    event Deposited(uint256 fromChainId, address fromToken, address from, uint256 amount);
    event Issued(InParam p);
    event Withdrawed(InParam p);
    // token which withdrawed in center chain
    event WithdrawedToCenter(InParam p);
    event CrossOuted(InParam p);
    event ForwardCrossOuted(InParam p);
    event ForwardCrossOutFailed(InParam p);
    event CrossIned(InParam p);
    event CrossInFailed(InParam p);
    event Supported(address token, uint256 chainId, bool status);
    event StakingRewardReseted(address oToken);
}
