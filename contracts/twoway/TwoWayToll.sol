// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../lib/SafeDecimalMath.sol";

contract TwoWayToll {
    using SafeDecimalMath for uint256;

    mapping(address => mapping(uint256 => uint256)) public feeAmountM;
    mapping(address => mapping(uint256 => uint256)) public feeRatioM;
    // mapping(address => mapping(uint256 => uint256)) public removeFeeAmount;
    mapping(address => uint256) public removeFeeAmount;
    mapping(address => mapping(uint256 => address)) public feeTo;
    address public feeToDev;

    event FeeChange(address token, uint256 chainID, uint256 feeAmount, uint256 feeRatio);
    event FeeToRemoved(address token, uint256 chainID, address account);
    event FeeToChanged(address token, uint256 chainID, address account);

    constructor(address _feeToDev) {
        feeToDev = _feeToDev;
    }

    function _setFeeToDev(address _feeToDev) internal {
        feeToDev = _feeToDev;
    }

    function _setFee(
        address token,
        uint256 chainID,
        uint256 _feeAmount,
        uint256 _feeRatio
    ) internal virtual {
        require(_feeRatio <= 1e18, "fee ratio not correct");

        feeAmountM[token][chainID] = _feeAmount;
        feeRatioM[token][chainID] = _feeRatio;
        emit FeeChange(token, chainID, _feeAmount, _feeRatio);
    }

    function _setRemoveFee(address token, uint256 _feeAmount) internal virtual {
        removeFeeAmount[token] = _feeAmount;
    }

    function calculateFee(
        address token,
        uint256 chainID,
        uint256 amount
    )
        public
        view
        virtual
        returns (
            uint256 feeAmountFix,
            uint256 feeAmountRatio,
            uint256 remainAmount
        )
    {
        feeAmountFix = feeAmountM[token][chainID];
        uint256 _feeRatio = feeRatioM[token][chainID];
        feeAmountRatio = amount.multiplyDecimal(_feeRatio);
        if (amount < feeAmountFix + feeAmountRatio) {
            feeAmountFix = 0;
        }
        remainAmount = amount - feeAmountFix - feeAmountRatio;
    }

    function calculateRemoveFee(address token, uint256 amount)
        public
        view
        virtual
        returns (uint256 feeAmount, uint256 remainAmount)
    {
        require(amount > removeFeeAmount[token], "not enough token");
        feeAmount = removeFeeAmount[token];
        remainAmount = amount - feeAmount;
    }
}
