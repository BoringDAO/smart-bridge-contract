// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./lib/SafeDecimalMath.sol";

contract Toll {
    using SafeMath for uint256;
    using SafeDecimalMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    // fee
    // leave ethereum
    mapping(address => uint256) public lockFeeRatio;
    mapping(address => uint256) public lockFeeAmount;
    // back ethereum
    mapping(address => uint256) public unlockFeeRatio;
    mapping(address => uint256) public unlockFeeAmount;

    mapping(address => EnumerableSet.AddressSet) internal feeToSet;

    event FeeChange(
        address token,
        uint256 lockFeeAmount,
        uint256 lockFeeRatio,
        uint256 unlockFeeAmount,
        uint256 unlockFeeRatio
    );

    event FeeToRemoved(address token, address account);

    event FeeToAdded(address token, address account);

    function _setFee(
        address token,
        uint256 _lockFeeAmount,
        uint256 _lockFeeRatio,
        uint256 _unlockFeeAmount,
        uint256 _unlockFeeRatio
    ) internal virtual {
        require(_lockFeeRatio <= 1e18, "fee ratio not correct");
        require(_unlockFeeRatio <= 1e18, "fee ratio not correct");

        lockFeeAmount[token] = _lockFeeAmount;
        lockFeeRatio[token] = _lockFeeRatio;
        unlockFeeAmount[token] = _unlockFeeAmount;
        unlockFeeRatio[token] = _unlockFeeRatio;
        emit FeeChange(token, _lockFeeAmount, _lockFeeRatio, _unlockFeeAmount, _unlockFeeRatio);
    }

    function _addFeeTo(address token, address account) internal virtual {
        require(feeToSet[token].contains(account) == false, "Toll::account was feeTo already");
        feeToSet[token].add(account);
        emit FeeToAdded(token, account);
    }

    function _removeFeeTo(address token, address account) internal virtual {
        require(feeToSet[token].contains(account) == true, "Toll::account is not feeTo");
        feeToSet[token].remove(account);
        emit FeeToRemoved(token, account);
    }

    function calculateFee(
        address token,
        uint256 amount,
        uint256 crossType
    ) public view virtual returns (uint256 feeAmount, uint256 remainAmount) {
        uint256 _feeMinAmount;
        uint256 _feeRatio;
        if (crossType == 0) {
            // leave ethereum
            _feeMinAmount = lockFeeAmount[token];
            _feeRatio = lockFeeRatio[token];
        } else {
            // back ethereum
            _feeMinAmount = unlockFeeAmount[token];
            _feeRatio = unlockFeeRatio[token];
        }
        feeAmount = _feeMinAmount.add(amount.multiplyDecimal(_feeRatio));
        remainAmount = amount.sub(feeAmount);
    }

    function feeToLength(address token) public view returns (uint256 len) {
        len = feeToSet[token].length();
    }

    function getFeeTo(address token, uint256 i) public view returns (address account) {
        account = feeToSet[token].at(i);
    }
}
