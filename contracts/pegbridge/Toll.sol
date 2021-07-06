// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "../lib/SafeDecimalMath.sol";

contract Toll {
    using SafeDecimalMath for uint256;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    mapping(address => mapping(uint256 => uint256)) feeAmountM;
    mapping(address => mapping(uint256 => uint256)) feeRatioM;
    mapping(address => mapping(uint256 => EnumerableSetUpgradeable.AddressSet)) internal feeToSet;

    event FeeChange(address token, uint256 chainID, uint256 feeAmount, uint256 feeRatio);
    event FeeToRemoved(address token, uint256 chainID, address account);
    event FeeToAdded(address token, uint256 chainID, address account);

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

    function _addFeeTo(address token, uint256 chainID, address account) internal virtual {
        require(feeToSet[token][chainID].contains(account) == false, "Toll::account was feeTo already");
        feeToSet[token][chainID].add(account);
        emit FeeToAdded(token, chainID, account);
    }

    function _removeFeeTo(address token, uint256 chainID, address account) internal virtual {
        require(feeToSet[token][chainID].contains(account) == true, "Toll::account is not feeTo");
        feeToSet[token][chainID].remove(account);
        emit FeeToRemoved(token, chainID, account);
    }

    function calculateFee(
        address token,
        uint256 chainID,
        uint256 amount
    ) public view virtual returns (uint256 feeAmount, uint256 remainAmount) {
        uint256 _feeMinAmount = feeAmountM[token][chainID];
        uint256 _feeRatio = feeRatioM[token][chainID];
        feeAmount = _feeMinAmount + amount.multiplyDecimal(_feeRatio);
        remainAmount = amount - feeAmount;
    }

    function feeToLength(address token, uint256 chainID) public view returns (uint256 len) {
        len = feeToSet[token][chainID].length();
    }

    function getFeeTo(address token, uint256 chainID, uint256 i) public view returns (address account) {
        account = feeToSet[token][chainID].at(i);
    }
}
