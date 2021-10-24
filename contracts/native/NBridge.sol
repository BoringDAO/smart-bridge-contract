// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interface/IToken.sol";
import "./NProposalVote.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./NToll.sol";
import "../struct/NCrossInParams.sol";

contract NBridge is NProposalVote, NToll, AccessControl {
    using SafeERC20 for IToken;

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

    constructor(uint256 _chainId) {
        chainId = _chainId;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

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
    ) public {
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

    function getRoleKey(address token, uint _chainId) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(token, _chainId));
        return key;
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

    function crossOut(
        address _token,
        uint256 toChainID,
        address to,
        uint256 amount
    ) external {
        require(amount > 0, "cross amount 0");
        TokenInfo memory ti = supportedTokens[chainId][_token];
        require(ti.isSupported, "not support token");
        uint256 minAmount = minCrossAmount[ti.mirrorAddress][toChainID];
        if (minAmount != 0) {
            require(amount >= minAmount, "amount less than minAmount");
        }
        if (ti.tokenType == 1) {
            // lock
            IToken(_token).safeTransferFrom(msg.sender, address(this), amount);
            emit CrossOut(_token, chainId, chainId, toChainID, msg.sender, to, amount);
        } else if (ti.tokenType == 2) {
            // burn
            IToken(_token).burn(msg.sender, amount);
            emit CrossOut(ti.mirrorAddress, ti.mirrorChainId, chainId, toChainID, msg.sender, to, amount);
        }
    }

    function crossIn(
        NCrossInParams memory p
    ) external onlyCrosser(p._originToken, p._originChainId) whenNotHandled(p.txid) {
        require(p.toChainId == chainId, "chainId error");
        TokenInfo memory ti = supportedTokens[p._originChainId][p._originToken];
        require(ti.isSupported, "not support token");

        bool result = _vote(p._originToken, p.txid);
        if (result) {
            txHandled[p.txid] = true;
            (uint256 feeAmount, uint256 remainAmount) = calculateFee(p._originToken, p.amount);
            if (ti.tokenType == 1) {
                // unlock
                IToken(ti.mirrorAddress).safeTransferFrom(address(this), p.to, remainAmount);
                if (feeAmount > 0) {
                    IToken(ti.mirrorAddress).safeTransferFrom(address(this), feeTo, feeAmount);
                }
            } else if (ti.tokenType == 2) {
                // mint
                IToken(ti.mirrorAddress).mint(p.to, remainAmount);
                if (feeAmount > 0) {
                    IToken(ti.mirrorAddress).mint(feeTo, feeAmount);
                }
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

    function setFee(address token, uint256 _feeRatio) external onlyAdmin {
        _setFee(token, _feeRatio);
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
}
