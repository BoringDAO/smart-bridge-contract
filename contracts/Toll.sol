// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./lib/SafeDecimalMath.sol";

contract Toll {
    using SafeMath for uint256;
    using SafeDecimalMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    // fee
    // leave ethereum
    uint256 public lockFeeRatio;
    uint256 public lockFeeAmount;
    // back ethereum
    uint256 public unlockFeeRatio;
    uint256 public unlockFeeAmount;

    EnumerableSet.AddressSet internal feeToSet;

    event FeeChange(
        uint256 lockFeeAmount,
        uint256 lockFeeRatio,
        uint256 unlockFeeAmount,
        uint256 unlockFeeRatio
    );

    event FeeToRemoved(
        address account
    );

    event FeeToAdded (
        address account
    );

    constructor(address[] memory _feeToSet) {
        for (uint i; i < _feeToSet.length; i++) {
            feeToSet.add(_feeToSet[i]);
        }
    }

    function _setFee(
        uint256 _lockFeeAmount,
        uint256 _lockFeeRatio,
        uint256 _unlockFeeAmount,
        uint256 _unlockFeeRatio
    ) internal virtual {
        require(_lockFeeRatio <= 1e18, "fee ratio not correct");
        require(_unlockFeeRatio <= 1e18, "fee ratio not correct");
        lockFeeAmount = _lockFeeAmount;
        lockFeeRatio = _lockFeeRatio;
        unlockFeeAmount = _unlockFeeAmount;
        unlockFeeRatio = _unlockFeeRatio;
        emit FeeChange(_lockFeeAmount, _lockFeeRatio, _unlockFeeAmount, _unlockFeeRatio);
    }

    function _addFeeTo(address account) internal virtual {
        require(feeToSet.contains(account) == false, "Toll::account was feeTo already");
        feeToSet.add(account);
        emit FeeToAdded(account);
    }

    function _removeFeeTo(address account) internal virtual {
        require(feeToSet.contains(account) == true, "Toll::account is not feeTo");
        feeToSet.remove(account);
        emit FeeToRemoved(account);
    }

    function calculateFee(
        uint256 amount,
        uint256 crossType
    ) public view virtual returns (uint256 feeAmount, uint256 remainAmount) {
        uint256 _feeMinAmount;
        uint256 _feeRatio;
        if (crossType == 0) {
            // leave ethereum
            _feeMinAmount = lockFeeAmount;
            _feeRatio = lockFeeRatio;
        } else {
            // back ethereum
            _feeMinAmount = unlockFeeAmount;
            _feeRatio = unlockFeeRatio;
        }
        feeAmount = _feeMinAmount.add(amount.multiplyDecimal(_feeRatio));
        remainAmount = amount.sub(feeAmount);
    }

    function feeToLength() public view returns(uint256 len) {
        len = feeToSet.length();
    }

    function getFeeTo(uint256 i) public view returns(address account) {
        account = feeToSet.at(i);
    }

}


