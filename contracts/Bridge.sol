// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interface/IToken.sol";
import "./ProposalVote.sol";
import "./Toll.sol";

contract Bridge is ProposalVote, Toll, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant CROSSER_ROLE = "CROSSER_ROLE";

    // token in ethereum
    address public token0;

    // token in bsc/avalanche
    IToken public token1;
    mapping(string => bool) public txMinted;

    event CrossBurn(
        address token0,
        address token1,
        address from,
        address to,
        uint256 amount
    );
    event CrossMint(
        address token0,
        address token1,
        address from,
        address to,
        uint256 amount,
        string txid
    );

    constructor(
        address[] memory _crosser,
        address _token0,
        IToken _token1,
        address[] memory _feeTo
    ) ProposalVote(_crosser.length) Toll(_feeTo) {
        for (uint256 i; i < _crosser.length; i++) {
            _setupRole(CROSSER_ROLE, _crosser[i]);
        }
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        token0 = _token0;
        token1 = _token1;
    }

    function crossMint(
        address from,
        address to,
        uint256 amount,
        string memory txid
    ) public onlyCrosser whenNotMinted(txid){
        bool result = _vote(address(token1), from, to, amount, txid);
        if (result) {
            // mint token
            (uint256 feeAmount, uint256 remainAmount) = calculateFee(amount, 0);
            token1.mint(to, remainAmount);
            uint256 feeToLen = feeToLength();
            for (uint256 i; i < feeToLen; i++) {
                token1.mint(getFeeTo(i), feeAmount.div(feeToLen));
            }
            txMinted[txid] = true;
            emit CrossMint(token0, address(token1), from, to, amount, txid);
        }
    }

    function crossBurn(address to, uint256 amount) public {
        require(
            token1.balanceOf(msg.sender) >= amount,
            "msg.sender not enough token to burn"
        );

        (uint256 feeAmount, uint256 remainAmount) = calculateFee(amount, 1);
        uint256 feeToLen = feeToLength();
        for (uint256 i; i < feeToLen; i++) {
            token1.transferFrom(msg.sender, getFeeTo(i), feeAmount.div(feeToLen));
        }
        token1.burn(msg.sender, remainAmount);
        emit CrossBurn(token0, address(token1), msg.sender, to, remainAmount);
    }

    function setThreshold(uint256 _threshold) external onlyAdmin {
        _setThreshold(_threshold);
    }

    function addFeeTo(address account) external onlyAdmin {
        _addFeeTo(account);
    }

    function removeFeeTo(address account) external onlyAdmin {
        _removeFeeTo(account);
    }

    function setFee(
        uint256 _lockFeeAmount,
        uint256 _lockFeeRatio,
        uint256 _unlockFeeAmount,
        uint256 _unlockFeeRatio
    ) external onlyAdmin {
        _setFee(
            _lockFeeAmount,
            _lockFeeRatio,
            _unlockFeeAmount,
            _unlockFeeRatio
        );
    }

    modifier onlyCrosser {
        require(
            hasRole(CROSSER_ROLE, msg.sender),
            "Bridge::caller is not crosser"
        );
        _;
    }

    modifier onlyAdmin {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Bridge::only admin can call"
        );
        _;
    }

    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "tx minted");
        _;
    }
}
