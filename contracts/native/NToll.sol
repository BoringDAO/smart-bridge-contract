// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../lib/SafeDecimalMath.sol";

contract NToll {
    using SafeDecimalMath for uint256;

    // fee
    mapping(address => uint256) public feeRatio;

    address public feeTo;

    event FeeChange(address token, uint256 feeRatio);

    event FeeToChanged(address account);

    function _setFee(address token, uint256 _feeRatio) internal virtual {
        require(_feeRatio <= 1e18, "fee ratio not correct");

        feeRatio[token] = _feeRatio;
        emit FeeChange(token, _feeRatio);
    }

    function _setFeeTo(address account) internal virtual {
        require(feeTo != account, "Toll::account was feeTo already");
        feeTo = account;
        emit FeeToChanged(account);
    }

    // function calculateFee(address token, uint256 amount)
    //     public
    //     view
    //     virtual
    //     returns (uint256 feeAmount, uint256 remainAmount)
    // {
    //     uint256 _feeRatio = feeRatio[token];
    //     feeAmount = amount.multiplyDecimal(_feeRatio);
    //     remainAmount = amount - feeAmount;
    // }
}
