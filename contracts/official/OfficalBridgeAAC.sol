// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OfficialBridge.sol";
import "../interface/IWETH9.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract OfficialBridgeAAC is OfficialBridge {
    using SafeERC20 for IERC20;

    address public wAACVault;

    function sendCoinCrossOut(address wCoin, uint256 amount) internal override {
        IWETH9(wCoin).deposit{value: amount}();
        IWETH9(wCoin).transfer(wAACVault, amount);
    }

    function sendCoinCrossIn(
        address wCoin,
        address to,
        uint256 amount
    ) internal override {
        IERC20(wCoin).safeTransferFrom(wAACVault, address(this), amount);
        IWETH9(wCoin).withdraw(amount);
        AddressUpgradeable.sendValue(payable(to), amount);
    }
}
