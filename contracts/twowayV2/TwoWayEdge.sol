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
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../interface/IWETH9.sol";

contract TwoWayEdge is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ProposalVote {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    mapping(address => mapping(uint256 => bool)) public chainSupported;
    mapping(address => bool) public tokenSupported;
    mapping(address => uint256) public decimalDiff;
    mapping(string => bool) public txHandled;
    uint256 public chainId;

    // To support native token
    mapping(address=>bool) public isCoin;
    bool public isClosed;

    // To index event
    uint public eventIndex;
    mapping(uint => uint) public eventHeight;


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

    function changeSupport(
        address token,
        uint256 _chainId,
        bool status
    ) external onlyAdmin {
        require(chainSupported[token][_chainId] != status, "status error");
        chainSupported[token][_chainId] = status;
        decimalDiff[token] = 10**(18 - IERC20MetadataUpgradeable(token).decimals());
        emit Supported(token, _chainId, status);
    }

    function addSupport(address token) external onlyAdmin {
        tokenSupported[token] = true;
    }

    function deposit(address token, uint256 amount) external payable addEventIndex {
        require(tokenSupported[token], "not supported token");
        if (isCoin[token]) {
            require(amount == msg.value);
            IWETH9(token).deposit{value: msg.value}();
        } else {
            IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        emit Deposited(chainId, token, msg.sender, amount * decimalDiff[token]);
    }

    /// @notice edge chain dont know  token address of toChain
    function crossOut(
        address fromToken,
        uint256 toChainId,
        address to,
        uint256 amount
    ) external payable addEventIndex{
        require(tokenSupported[fromToken], "not supported token");
        require(chainSupported[fromToken][toChainId], "not supported chain");
        require(toChainId != chainId, "toChainId error");
        if (isCoin[fromToken]) {
            require(msg.value == amount, "amount error");
            IWETH9(fromToken).deposit{value: msg.value}();
        } else {
            IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        emit CrossOuted(OutParam(chainId, fromToken, msg.sender, toChainId, to, amount * decimalDiff[fromToken]));
    }

    /// @notice crosser of one token to call this
    function crossIn(InParam memory p, string memory txid) external onlyCrosser(p.toToken) whenNotHandled(txid) reentGuard addEventIndex{
        require(p.toChainId == chainId, "chianid error");
        require(tokenSupported[p.toToken], "not supported token");
        require(chainSupported[p.toToken][p.fromChainId], "not supported chain");
        bool result = _vote(p.toToken, p.from, p.to, p.amount, txid);
        if (result) {
            txHandled[txid] = true;
            uint256 amountAdjust = p.amount / decimalDiff[p.toToken];
            if (isCoin[p.toToken]) {
                IWETH9(p.toToken).withdraw(amountAdjust);
                AddressUpgradeable.sendValue(payable(p.to), amountAdjust);
            } else {
                IERC20Upgradeable(p.toToken).safeTransfer(p.to, amountAdjust);
            }
            emit CrossIned(p);
        }
    }

    function setThreshold(address token0, uint256 _threshold) external onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function setIsCoin(address token, bool _isCoin) external onlyAdmin {
        isCoin[token] = _isCoin;
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

    modifier reentGuard {
        require(isClosed == false, "closed");
        isClosed = true;
        _;
        isClosed = false;
    }

    modifier addEventIndex {
        _;
        eventHeight[eventIndex] = block.number;
        eventIndex += 1;
    }

    event Deposited(uint256 fromChainId, address fromToken, address from, uint256 amount);
    event CrossOuted(OutParam p);
    event CrossIned(InParam p);
    event Supported(address token, uint256 chainId, bool status);
}
