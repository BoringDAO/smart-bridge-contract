// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interface/IToken.sol";
import "../native/NProposalVote.sol";
import "../native/NToll.sol";
import "../struct/NCrossInParams.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

abstract contract OfficialBridge is Initializable, AccessControlUpgradeable, UUPSUpgradeable, NProposalVote, NToll {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeDecimalMath for uint256;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public chainId;

    // token_current_chain => toChainId => token_toChainId
    mapping(address => mapping(uint256 => address)) crossOutTokens;
    // from_chianId => from_chain_token => current_token
    mapping(uint256 => mapping(address => address)) public crossInTokens;
    // current_token => 0, 1, 2
    mapping(address => uint256) public tokenTypes;

    mapping(string => bool) public txHandled;
    mapping(address => mapping(uint256 => uint256)) public minCrossAmount;
    mapping(address => mapping(uint256 => uint256)) public fixFees;
    mapping(address => mapping(uint256 => uint256)) public ratioFees;
    mapping(address => mapping(address => bool)) public isInWhitelist;

    // To support native token
    mapping(address => bool) public isCoin;
    bool public locked;

    //  index mapping 0
    mapping(uint256 => uint256) public eventIndex0;
    mapping(uint256 => mapping(uint256 => uint256)) public eventHeights0;

    // index mapping 1
    uint256 public eventIndex1;
    mapping(uint256 => uint256) public eventHeights1;

    // token_on_current_chain => toChainId => amount
    mapping(address => mapping(uint256 => uint256)) public liquidity;

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

    function addCrossOutToken(
        address fromToken,
        uint256 toChainId,
        address toToken,
        uint256 fromTokenType
    ) public onlyAdmin {
        require(fromToken != address(0), "error token address");
        if (tokenTypes[fromToken] == 0) {
            tokenTypes[fromToken] = fromTokenType;
        }
        crossOutTokens[fromToken][toChainId] = toToken;
    }
    function addCrossOutTokens(
        address[] memory fromTokens,
        uint256[] memory toChainIds,
        address[] memory toTokens,
        uint256[] memory _tokenTypes
    ) external {
        uint256 tokenLength = fromTokens.length;
        require(tokenLength == toChainIds.length, "length not match");
        require(tokenLength == toTokens.length, "length not match");
        require(tokenLength == _tokenTypes.length, "length not match");
        for (uint256 i; i < tokenLength; i++) {
            addCrossOutToken(fromTokens[i], toChainIds[i], toTokens[i], _tokenTypes[i]);
        }
    }

    function addCrossInToken(
        uint fromChainId, 
        address fromToken, 
        address toToken
     ) public onlyAdmin {
         require(fromToken != address(0), "address(0)");
         require(toToken != address(0), "address(0)");
         crossInTokens[fromChainId][fromToken] = toToken;
    }

    function addCrossInTokens(
        uint[] memory fromChainIds, 
        address[] memory fromTokens, 
        address[] memory toTokens
    ) external onlyAdmin {
        uint len = fromChainIds.length;
        for (uint i; i < len; i++) {
            addCrossInToken(fromChainIds[i], fromTokens[i], toTokens[i]);
        }
    }


    function getRoleKey(address token, uint256 _chainId) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(token, _chainId));
        return key;
    }

    function sendCoinCrossOut(address wCoin, uint256 amount) internal virtual;

    function crossOut(
        address fromToken,
        uint256 toChainID,
        address to,
        uint256 amount
    ) public payable virtual reentGuard addEventIndex0(toChainID) addEventIndex1 {
        if (!isInWhitelist[fromToken][msg.sender]) {
            require(amount > fixFees[fromToken][toChainID], "cross amount 0");
        }
        address toToken = crossOutTokens[fromToken][toChainID];
        require(toToken != address(0), "not support token");

        (uint256 fixAmount, uint256 ratioAmount, uint256 remainAmount) = calculateFee(fromToken, toChainID, amount);
        require(remainAmount > 0, "remainAmount = 0");
        uint256 feeAmount = fixAmount + ratioAmount;
        if (isCoin[fromToken]) {
            require(msg.value == amount, "amount error");
            require(liquidity[fromToken][toChainID] >= amount, "liquidity error");
            sendCoinCrossOut(fromToken, amount);
            if (feeAmount > 0) {
                AddressUpgradeable.sendValue(payable(feeTo), feeAmount);
            }
            liquidity[fromToken][toChainID] -= amount;
            emit CrossOut(chainId, fromToken, toChainID, toToken, msg.sender, to, remainAmount);
        } else {
            if (tokenTypes[fromToken] == 1) {
                // lock
                IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), remainAmount);
                if (feeAmount > 0) {
                    IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, feeTo, feeAmount);
                }
                emit CrossOut(chainId, fromToken, toChainID, toToken, msg.sender, to, remainAmount);
            } else if (tokenTypes[fromToken] == 2) {
                // burn
                require(to != toToken, "TE");
                /// @notices "when derive token to origin chain"
                require(liquidity[fromToken][toChainID] >= amount, "liquidity error");
                IToken(fromToken).burn(msg.sender, remainAmount);
                if (feeAmount > 0) {
                    IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, feeTo, feeAmount);
                }
                liquidity[fromToken][toChainID] -= amount;
                emit CrossOut(chainId, fromToken, toChainID, toToken, msg.sender, to, remainAmount);
            }
        }
    }

    struct CrossInParam {
        uint256 fromChainId;
        address fromToken;
        uint256 toChainId;
        address toToken;
        address from;
        address to;
        uint256 amount;
        string txid;
    }

    function _voteForOffical(CrossInParam memory p) internal virtual returns (bool result) {
        require(threshold[p.toToken] > 0, "ProposalVote: threshold should be greater than 0");
        uint256 count = threshold[p.toToken];
        bytes32 mid = keccak256(abi.encode(p));
        require(isFinished[mid] == false, "_vote::proposal finished");
        require(isVoted[mid][msg.sender] == false, "_vote::msg.sender voted");
        counter[mid] = counter[mid] + 1;
        isVoted[mid][msg.sender] = true;

        if (counter[mid] >= count) {
            isFinished[mid] = true;
            result = true;
        }
        emit ProposalVoted(p.toToken, msg.sender, counter[mid], count);
    }

    function sendCoinCrossIn(
        address wCoin,
        address to,
        uint256 amount
    ) internal virtual {}

    function crossIn(CrossInParam memory p)
        public
        virtual
        onlyCrosser(p.toToken, p.toChainId)
        whenNotHandled(p.txid)
        reentGuard
        addEventIndex1
    {
        require(p.toChainId == chainId, "chainId error");
        address token = crossInTokens[p.fromChainId][p.fromToken];
        require(token != address(0), "not support token");
        require(p.toToken == token, "not match");

        bool result = _voteForOffical(p);
        if (result) {
            txHandled[p.txid] = true;
            if (isCoin[p.toToken]) {
                sendCoinCrossIn(p.toToken, p.to, p.amount);
                // AddressUpgradeable.sendValue(payable(p.to), p.amount);
                liquidity[p.toToken][p.fromChainId] += p.amount;
            } else {
                if (tokenTypes[p.toToken] == 1) {
                    // unlock
                    IERC20Upgradeable(p.toToken).safeTransfer(p.to, p.amount);
                } else if (tokenTypes[p.toToken] == 2) {
                    // mint
                    liquidity[p.toToken][p.fromChainId] += p.amount;
                    IToken(p.toToken).mint(p.to, p.amount);
                }
            }

            emit CrossIn(p.fromChainId, p.fromToken, p.toChainId, p.toToken, p.from, p.to, p.amount);
        }
    }

    function setThreshold(address token0, uint256 _threshold) external onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function setFeeTo(address account) external onlyAdmin {
        _setFeeTo(account);
    }

    function setFee(
        address fromToken,
        uint256 toChainId,
        uint256 _feeFix,
        uint256 _feeRatio
    ) public onlyAdmin {
        fixFees[fromToken][toChainId] = _feeFix;
        ratioFees[fromToken][toChainId] = _feeRatio;
    }

    function setFees(
        address[] memory fromTokens,
        uint256[] memory toChainIds,
        uint256[] memory _feeFixMulti,
        uint256[] memory _feeRatioMulti
    ) external {
        require(fromTokens.length == toChainIds.length, "not match");
        require(fromTokens.length == _feeFixMulti.length, "not match");
        require(fromTokens.length == _feeRatioMulti.length, "not match");
        for (uint256 i; i < fromTokens.length; i++) {
            setFee(fromTokens[i], toChainIds[i], _feeFixMulti[i], _feeRatioMulti[i]);
        }
    }

    function setIsCoin(address _token, bool _isCoin) external onlyAdmin {
        require(isCoin[_token] != _isCoin, "DNC"); // dont't need change
        isCoin[_token] = _isCoin;
        emit CoinSeted(_token);
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
        require(!locked, "No reent");
        locked = true;
        _;
        locked = false;
    }

    modifier addEventIndex0(uint256 toChainId) {
        _;
        uint256 newIndex = eventIndex0[toChainId] += 1;
        eventHeights0[toChainId][newIndex] = block.number;
    }

    modifier addEventIndex1() {
        _;
        eventIndex1 += 1;
        eventHeights1[eventIndex1] = block.number;
    }

    event CrossOut(
        uint256 fromChainId,
        address fromToken,
        uint256 toChainId,
        address toToken,
        address from,
        address to,
        uint256 amount
    );
    event CrossIn(
        uint256 fromChainId,
        address fromToken,
        uint256 toChainId,
        address toToken,
        address from,
        address to,
        uint256 amount
    );

    event CoinSeted(address coinAddress);

    event WhiteAddressSeted(address token, address user);

    function setWhitelist(
        address token,
        address user,
        bool _isInWhitelist
    ) external onlyAdmin {
        require(isInWhitelist[token][user] != _isInWhitelist, "error state");
        isInWhitelist[token][user] = _isInWhitelist;
        emit WhiteAddressSeted(token, user);
    }
}
