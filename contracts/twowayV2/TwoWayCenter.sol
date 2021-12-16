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

contract TwoWayCenter is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ProposalVote {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant CROSSER_ROLE = keccak256("CROSSER_ROLE");

    uint256 public chainid;
    mapping(uint256 => mapping(address => address)) public toCenterToken;
    mapping(address => mapping(uint256 => address)) public toEdgeToken;
    mapping(address => uint256) public decimalDiff;
    mapping(string => bool) public txHandled;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(uint256 _chainid) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        chainid = _chainid;
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
        if (_edgeChainId == chainid) {
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
        address centerToken = toCenterToken[chainid][token];
        require(centerToken != address(0), "not support");
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        IToken(centerToken).mint(msg.sender, amount * decimalDiff[token]);
        emit CenterDeposited(chainid, token, amount * decimalDiff[token]);
    }

    function crossOut(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
        address _centerToken = toCenterToken[chainid][fromToken];
        require(_centerToken != address(0), "not support");
        address _edgeToken = toEdgeToken[_centerToken][toChainId];
        require(_edgeToken != address(0), "not support");
        IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), amount);
		address edgeToken = toEdgeToken[toCenterToken[chainid][fromToken]][toChainId];
        emit CenterCrossOuted(InParam(chainid, fromToken, msg.sender, toChainId, edgeToken, to, amount * decimalDiff[fromToken]));
    }

    function forwardCrossOut(OutParam memory p, string memory txid) external onlyCrosser whenNotHandled(txid) {
        bool result = _vote(p.fromToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            address edgeToken = toEdgeToken[toCenterToken[p.fromChainId][p.fromToken]][p.toChainId];
            emit CenterCrossOuted(InParam(p.fromChainId, p.fromToken, p.from, p.toChainId, edgeToken, p.to, p.amount));
        }
    }

    function crossIn(OutParam memory p, string memory txid) external onlyCrosser whenNotHandled(txid) {
        require(p.toChainId == chainid, "chainid error");
		address centerToken = toCenterToken[chainid][p.fromToken];
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

    function issue(InParam memory tp, string memory txid) external onlyRole(CROSSER_ROLE) whenNotHandled(txid) {
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
        onlyRole(CROSSER_ROLE)
        whenNotHandled(txid)
    {
        require(p.toChainId == chainid, "chainid error");
        require(toCenterToken[chainid][p.toToken] != address(0), "not support");
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
		address _edgeToken = toEdgeToken[fromToken][chainid];
        IToken(fromToken).burn(msg.sender, amount);
        if (toChainId == chainid) {
            require(IERC20Upgradeable(_edgeToken).balanceOf(address(this)) >= amount, "not enough");
            IERC20Upgradeable(_edgeToken).safeTransfer(msg.sender, amount);
			// emit CenterWithdrawed();
        } else {
        	emit Withdrawed(InParam(chainid, fromToken, msg.sender, toChainId, _edgeToken, to, amount));
		}
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "TwoWay: caller is not admin");
        _;
    }

    modifier onlyCrosser() {
        require(hasRole(CROSSER_ROLE, msg.sender), "TwoWay: caller is not crosser");
        _;
    }

    modifier whenNotHandled(string memory _txid) {
        require(txHandled[_txid] == false, "TwoWay: tx minted");
        _;
    }

    event Deposited(address token, uint256 amount);
    event Withdrawed(InParam p);
    event CenterDeposited(uint256 fromChainId, address token, uint256 amount);
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
