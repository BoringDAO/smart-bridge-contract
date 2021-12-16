// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// import "../interface/ISwapPair.sol";
// import "../interface/IBoringToken.sol";
import "../ProposalVote.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TwParams.sol";

contract TwoWayEdge is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ProposalVote {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant CROSSER_ROLE = keccak256("CROSSER_ROLE");

    mapping(address => mapping(uint256 => bool)) public chainSupported;
    mapping(address => bool) public tokenSupported;
    mapping(address => uint256) public decimalDiff;
    mapping(string => bool) public txHandled;
    uint256 public chainid;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(uint256 _chainid) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _chainid = chainid;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function changeSupport(
        address token,
        uint256 chainId,
        bool status
    ) external {
        require(chainSupported[token][chainId] != status, "status error");
        chainSupported[token][chainId] = status;
        decimalDiff[token] = 10**(18 - IERC20MetadataUpgradeable(token).decimals());
        emit Supported(token, chainId, status);
    }

    function deposit(address token, uint256 amount) external {
        require(tokenSupported[token], "not supported token");
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(chainid, token, amount * decimalDiff[token]);
    }

    function crossOut(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external {
        require(tokenSupported[fromToken], "not supported token");
        require(chainSupported[fromToken][toChainId], "not supported chain");
        IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        emit CrossOuted(OutParam(chainid, fromToken, msg.sender, toChainId, to, amount * decimalDiff[fromToken]));
    }

    function crossIn(InParam memory p, string memory txid) external onlyCrosser whenNotHandled(txid) {
        require(p.toChainId == chainid, "chianid not support");
        require(tokenSupported[p.toToken], "not supported token");
        require(chainSupported[p.toToken][p.fromChainId], "not supported chain");
        bool result = _vote(p.toToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            uint256 amountAdjust = p.amount / decimalDiff[p.toToken];
            if (IERC20Upgradeable(p.toToken).balanceOf(address(this)) >= amountAdjust) {
                IERC20Upgradeable(p.toToken).safeTransfer(p.to, amountAdjust);
                emit CrossIned(p);
            } else {
                emit CrossInFailed(p);
            }
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

    event Deposited(uint fromChainId, address token, uint256 amount);
    event CrossOuted(OutParam p);
    event CrossIned(InParam p);
    event CrossInFailed(InParam p);
    event Supported(address token, uint256 chainId, bool status);
}
