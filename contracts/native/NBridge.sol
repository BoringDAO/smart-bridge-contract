// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interface/IToken.sol";
import "./NProposalVote.sol";
import "./NToll.sol";
import "../struct/NCrossInParams.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract NBridge is Initializable, AccessControlUpgradeable, UUPSUpgradeable, NProposalVote, NToll {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public chainId;

    struct TokenInfo {
        uint256 tokenType;
        address mirrorAddress;
        uint256 mirrorChainId;
        bool isSupported;
    }

    mapping(uint256 => mapping(address => TokenInfo)) public supportedTokens;
    mapping(string => bool) public txHandled;
    mapping(address => mapping(uint256 => uint256)) public minCrossAmount;
    mapping(address => mapping(uint256 => uint256)) public fixFees;
    mapping(address => mapping(uint256 => uint256)) public ratioFees;
    using SafeDecimalMath for uint256;
    mapping(address => mapping(address => bool)) public isInWhitelist;

    // To support native token
    mapping(address => bool) public isCoin;
    bool public isClosed;

    //  index mapping 0
    mapping(uint256 => uint256) public eventIndex0;
    mapping(uint256 => mapping(uint256 => uint256)) public eventHeights0;

    // index mapping 1
    uint256 public eventIndex1;
    mapping(uint256 => uint256) public eventHeights1;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(uint256 _chainId) public initializer {
        chainId = _chainId;
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function setMinCrossAmount(
        address token,
        uint256 _chainId,
        uint256 amount
    ) external onlyAdmin {
        minCrossAmount[token][_chainId] = amount;
    }

    function addSupportToken(
        uint256 _chainId,
        address _token,
        TokenInfo memory ti
    ) public onlyAdmin {
        require(_token != address(0), "error token address");
        // require(supportedTokens[_chainId][_token].isSupported = false, "Token already supported");
        require(ti.isSupported == true, "params error");
        supportedTokens[_chainId][_token] = ti;
    }

    function addMultiSupportTokens(
        uint256[] memory _chainIds,
        address[] memory _tokens,
        TokenInfo[] memory tis
    ) external {
        uint256 tokenLength = _tokens.length;
        require(tokenLength == tis.length, "length not match");
        for (uint256 i; i < tokenLength; i++) {
            addSupportToken(_chainIds[i], _tokens[i], tis[i]);
        }
    }

    function getRoleKey(address token, uint256 _chainId) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(token, _chainId));
        return key;
    }

    function crossOut(
        address _token,
        uint256 toChainID,
        address to,
        uint256 amount
    ) external payable reentGuard addEventIndex0(toChainID) addEventIndex1 {
        if (!isInWhitelist[_token][msg.sender]) {
            require(amount > fixFees[_token][toChainID], "cross amount 0");
        }
        TokenInfo memory ti = supportedTokens[chainId][_token];
        require(ti.isSupported, "not support token");
        (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(_token, toChainID, amount);
        require(remainAmount > 0, "remainAmount = 0");
        uint256 feeAmount = fixAmount + ratioAmount;
        if (ti.tokenType == 1) {
            // lock
            if (isCoin[_token]) {
                require(msg.value == amount, "amount error");
                if (feeAmount > 0) {
                    AddressUpgradeable.sendValue(payable(feeTo), feeAmount);
                }
            } else {
                IERC20Upgradeable(_token).safeTransferFrom(msg.sender, address(this), remainAmount);
                if (feeAmount > 0) {
                    IERC20Upgradeable(_token).safeTransferFrom(msg.sender, feeTo, feeAmount);
                }
            }
            emit CrossOut(_token, chainId, chainId, toChainID, msg.sender, to, remainAmount);
        } else if (ti.tokenType == 2) {
            // burn
            require(to != ti.mirrorAddress, "TE");
            IToken(_token).burn(msg.sender, remainAmount);
            if (feeAmount > 0) {
                IERC20Upgradeable(_token).safeTransferFrom(msg.sender, feeTo, feeAmount);
            }
            emit CrossOut(ti.mirrorAddress, ti.mirrorChainId, chainId, toChainID, msg.sender, to, remainAmount);
        }
    }

    function crossIn(NCrossInParams memory p)
        external
        onlyCrosser(p._originToken, p._originChainId)
        whenNotHandled(p.txid)
        reentGuard
        addEventIndex1
    {
        require(p.toChainId == chainId, "chainId error");
        TokenInfo memory ti = supportedTokens[p._originChainId][p._originToken];
        require(ti.isSupported, "not support token");
        bool result = _vote(p);
        if (result) {
            txHandled[p.txid] = true;
            if (ti.tokenType == 1) {
                // unlock
                if (isCoin[ti.mirrorAddress]) {
                    AddressUpgradeable.sendValue(payable(p.to), p.amount);
                } else {
                    IERC20Upgradeable(ti.mirrorAddress).safeTransfer(p.to, p.amount);
                }
            } else if (ti.tokenType == 2) {
                // mint
                IToken(ti.mirrorAddress).mint(p.to, p.amount);
            }
            emit CrossIn(p._originToken, p._originChainId, p.fromChainId, p.toChainId, p.from, p.to, p.amount);
        }
    }

    function setThreshold(address token0, uint256 _threshold) external onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function setFeeTo(address account) external onlyAdmin {
        _setFeeTo(account);
    }

    // function setFee(address token, uint256 _feeRatio) external onlyAdmin {
    //     _setFee(token, _feeRatio);
    // }

    function setFee(
        address token,
        uint256 toChainId,
        uint256 _feeFix,
        uint256 _feeRatio
    ) public onlyAdmin {
        fixFees[token][toChainId] = _feeFix;
        ratioFees[token][toChainId] = _feeRatio;
    }

    function setFees(
        address[] memory tokens,
        uint256[] memory toChainIds,
        uint256[] memory _feeFixMulti,
        uint256[] memory _feeRatioMulti
    ) external {
        require(tokens.length == toChainIds.length, "not match");
        require(tokens.length == _feeFixMulti.length, "not match");
        require(tokens.length == _feeRatioMulti.length, "not match");
        for (uint256 i; i < tokens.length; i++) {
            setFee(tokens[i], toChainIds[i], _feeFixMulti[i], _feeRatioMulti[i]);
        }
    }

    function setIsCoin(address _token, bool _isCoin) external onlyAdmin {
        require(isCoin[_token] != _isCoin, "DNC"); // dont't need change
        isCoin[_token] = _isCoin;
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
        if (isInWhitelist[token][msg.sender]) {
            return (fixAmount, ratioAmount, amount);
        }
        fixAmount = fixFees[token][toChainId];
        uint256 r1 = amount - fixAmount;
        ratioAmount = ratioFees[token][toChainId].multiplyDecimal(r1);
        remainAmount = amount - fixAmount - ratioAmount;
    }

    modifier whenNotHandled(string memory _txid) {
        require(txHandled[_txid] == false, "tx handled");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "caller is not admin");
        _;
    }

    modifier onlyCrosser(address token, uint256 _chainId) {
        bytes32 key = getRoleKey(token, _chainId);
        require(hasRole(key, msg.sender), "Bridge::caller is not crosser");
        _;
    }

    modifier reentGuard() {
        require(isClosed == false, "closed");
        isClosed = true;
        _;
        isClosed = false;
    }

    modifier addEventIndex0(uint256 toChainId) {
        _;
        uint newIndex = eventIndex0[toChainId] += 1;
        eventHeights0[toChainId][newIndex] = block.number;
    }

    modifier addEventIndex1() {
        _;
        eventIndex1 += 1;
        eventHeights1[eventIndex1] = block.number;
    }

    event CrossOut(
        address originToken,
        uint256 originChainId,
        uint256 fromChainId,
        uint256 toChainId,
        address from,
        address to,
        uint256 amount
    );
    event CrossIn(
        address originToken,
        uint256 originChainId,
        uint256 fromChainId,
        uint256 toChainId,
        address from,
        address to,
        uint256 amount
    );

    function setWhitelist(
        address token,
        address user,
        bool _isInWhitelist
    ) external onlyAdmin {
        require(isInWhitelist[token][user] != _isInWhitelist, "error state");
        isInWhitelist[token][user] = _isInWhitelist;
    }
}
