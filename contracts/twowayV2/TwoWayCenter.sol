// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// import "../interface/ISwapPair.sol";
// import "../interface/IBoringToken.sol";
import "../ProposalVote.sol";
import "../interface/IToken.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TwParams.sol";
import "../lib/SafeDecimalMath.sol";

contract TwoWayCenter is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ProposalVote {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeDecimalMath for uint;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public chainId;
    address public feeTo;
    mapping(uint256 => mapping(address => address)) public toCenterToken;
    mapping(address => mapping(uint256 => address)) public toEdgeToken;
    mapping(address => uint256) public decimalDiff;
    mapping(string => bool) public txHandled;
    mapping(address => mapping(uint => uint)) public fixFees;
    mapping(address => mapping(uint => uint)) public ratioFees;
    

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(uint256 _chainId) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        chainId = _chainId;
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
            decimalDiff[_centerToken] = 10**(18 - IERC20MetadataUpgradeable(_centerToken).decimals());
        }
    }

    function removeToken(
        address _centerToken,
        uint256 _edgeChainId,
        address _edgeToken
    ) external onlyAdmin {
        require(toCenterToken[_edgeChainId][_edgeToken] != address(0), "centerToken exist");
        require(toEdgeToken[_centerToken][_edgeChainId] != address(0), "edgeToken exist");
        delete toCenterToken[_edgeChainId][_edgeToken];
        delete toEdgeToken[_centerToken][_edgeChainId];
    }

    function deposit(address token, uint256 amount) external {
        address centerToken = toCenterToken[chainId][token];
        require(centerToken != address(0), "not support");
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        IToken(centerToken).mint(msg.sender, amount * decimalDiff[token]);
        emit CenterDeposited(chainId, token, msg.sender, amount * decimalDiff[token]);
    }

    function crossOut(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
        address _centerToken = toCenterToken[chainId][fromToken];
        require(_centerToken != address(0), "not support");
        address _edgeToken = toEdgeToken[_centerToken][toChainId];
        require(_edgeToken != address(0), "not support");
		address edgeToken = toEdgeToken[toCenterToken[chainId][fromToken]][toChainId];
        (uint fixAmount, uint ratioAmount, uint remainAmount) = calculateFee(fromToken, toChainId, amount);
        IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), remainAmount);
        IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, feeTo, fixAmount+ratioAmount);
        emit CenterCrossOuted(InParam(chainId, fromToken, msg.sender, toChainId, edgeToken, to, remainAmount * decimalDiff[fromToken]));
    }

    function forwardCrossOut(OutParam memory p, string memory txid) external onlyCrosser(toCenterToken[p.fromChainId][p.fromToken]) whenNotHandled(txid) {
        bool result = _vote(p.fromToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            address centerToken = toCenterToken[p.fromChainId][p.fromToken];
            address edgeToken = toEdgeToken[centerToken][p.toChainId];
            (uint fixAmount, uint ratioAmount, uint remainAmount) = calculateFee(centerToken, p.toChainId, p.amount);
            IToken(centerToken).mint(feeTo, fixAmount+ratioAmount);
            emit CenterCrossOuted(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, remainAmount));
        }
    }

    function crossIn(OutParam memory p, string memory txid) external onlyCrosser(toCenterToken[chainId][p.fromToken]) whenNotHandled(txid) {
        require(p.toChainId == chainId, "chainId error");
		address centerToken = toCenterToken[chainId][p.fromToken];
		address edgeToken = toEdgeToken[centerToken][p.toChainId];
        require( centerToken != address(0), "not support");
        bool result = _vote(p.fromToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            uint256 amountAdjust = p.amount / decimalDiff[edgeToken];
            if (IERC20Upgradeable(edgeToken).balanceOf(address(this)) >= amountAdjust) {
                IERC20Upgradeable(edgeToken).safeTransfer(p.to, amountAdjust);
                emit CrossIned(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, p.amount));
            }else {
				IToken(centerToken).mint(p.to, p.amount);
				emit CenterCrossInFailed(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, p.amount));
			}
        }
    }

    function issue(InParam memory tp, string memory txid) external onlyCrosser(toCenterToken[tp.fromChainId][tp.fromToken]) whenNotHandled(txid) {
        address _centerToken = toCenterToken[tp.fromChainId][tp.fromToken];
        require(_centerToken != address(0), "centerToken exist");
        require(toEdgeToken[_centerToken][tp.fromChainId] != address(0), "edgeToken exist");
        bool result = _vote(tp.fromToken, tp.from, tp.to, tp.amount, txid);
        if (result) {
            txHandled[txid] = true;
            IToken twt = IToken(_centerToken);
            twt.mint(tp.to, tp.amount);
            emit Issued(address(twt), tp.to, tp.amount);
        }
    }

    function rollbackCrossIn(InParam memory p, string memory txid)
        external
        onlyCrosser(toCenterToken[p.fromChainId][p.fromToken])
        whenNotHandled(txid)
    {
        require(p.toChainId == chainId, "chainId error");
        require(toCenterToken[chainId][p.toToken] != address(0), "not support");
        bool result = _vote(p.toToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            address _centerToken = toCenterToken[p.fromChainId][p.fromToken];
            IToken twt = IToken(_centerToken);
            twt.mint(p.to, p.amount);
            emit RollbackCrossIned(p);
        }
    }

    /// twt => two way token
    function withdraw(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
		address _edgeToken = toEdgeToken[fromToken][chainId];
        IToken(fromToken).burn(msg.sender, amount);
        if (toChainId == chainId) {
            require(IERC20Upgradeable(_edgeToken).balanceOf(address(this)) >= amount, "not enough");
            IERC20Upgradeable(_edgeToken).safeTransfer(msg.sender, amount);
			// emit CenterWithdrawed();
        } else {
        	emit Withdrawed(InParam(chainId, fromToken, msg.sender, toChainId, _edgeToken, to, amount));
		}
    }

    function calculateFee(
        address token,
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
        fixAmount = fixFees[token][toChainId];
        uint256 r1 = amount - fixAmount;
        ratioAmount = ratioFees[token][toChainId].multiplyDecimal(r1);
        remainAmount = amount - fixAmount - ratioAmount;
    }

    function getRoleKey(address toToken) public pure returns(bytes32 key) {
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

    event Withdrawed(InParam p);
    event CenterDeposited(uint256 fromChainId, address fromToken, address from,  uint256 amount);
    event CrossOuted(OutParam p);
    event CenterCrossOuted(InParam p);
    event TwtCrossOuted();
    event CrossIned(InParam p);
    event CrossInFailed(InParam p);
    event CenterCrossInFailed(InParam p);
    event RollbackCrossIned(InParam p);
    event Supported(address token, uint256 chainId, bool status);
    event Issued(address token, address to, uint256 amount);
}
