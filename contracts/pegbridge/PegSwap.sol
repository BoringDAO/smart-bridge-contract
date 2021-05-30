// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IPegSwapPair.sol";

contract PegSwap is Ownable {
    using SafeMath for uint256;

    address public pegProxy;

    // origin token address => pair address
    // example: dai => pair(token0=dai, token1=borDAI)
    mapping(address => address) public pairs;

    function setPegProxy(address _pegProxy) public {
        pegProxy = _pegProxy;
    }

    function getPair(address token) public view onlySupportToken(token) returns (address) {
        return pairs[token];
    }

    function addPair(address token, address pair) public onlyOwner {
        require(pairs[token] == address(0), "PegSwap: token already supported");
        pairs[token] = pair;
    }

    function removePair(address token) public onlyOwner {
        require(pairs[token] != address(0), "PegSwap: token not supported");
        delete pairs[token];
    }

    function addLiquidity(
        address token0,
        uint256 amount,
        address to
    ) public onlySupportToken(token0) returns (uint256 liquidity) {
        address pair = getPair(token0);
        IERC20(token0).transferFrom(msg.sender, pair, amount);
        liquidity = IPegSwapPair(pair).mint(to);
    }

    function removeLiquidity(
        address token0,
        uint256 liquidity,
        address to
    ) public onlySupportToken(token0) returns (uint256 amount0, uint256 amount1) {
        address pair = getPair(token0);
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (amount0, amount1) = IPegSwapPair(pair).burn(to);
    }

    // token0 -> token1
    function swapToken0ForToken1(
        address token0,
        uint256 amountIn,
        address to
    ) public onlySupportToken(token0) onlyPegProxy {
        require(amountIn > 0, "PegSwap: input must be greater than 0");
        address pair = getPair(token0);

        // transfer erc20 token to pair address
        IERC20(token0).transferFrom(msg.sender, pair, amountIn);
        IPegSwapPair(pair).swap(to, true);
    }

    // token1 -> token0
    function swapToken1ForToken0(
        address token0,
        uint256 amountIn,
        address to
    ) public onlySupportToken(token0) onlyPegProxy {
        require(amountIn > 0, "PegSwap: input must be greater than 0");
        address pair = getPair(token0);
        address token1 = IPegSwapPair(pair).token1();

        // transfer bor-erc20 token to pair address
        IERC20(token1).transferFrom(msg.sender, pair, amountIn);
        IPegSwapPair(pair).swap(to, false);
    }

    function getMaxToken1AmountOut(address token0) public view returns (uint256) {
        address pair = getPair(token0);
        (, uint256 _reserve1) = IPegSwapPair(pair).getReserves();

        return _reserve1;
    }

    modifier onlySupportToken(address token) {
        require(pairs[token] != address(0), "PegSwap: not support this token");
        _;
    }

    modifier onlyPegProxy {
        require(msg.sender == pegProxy, "PegSwap: caller is not pegProxy");
        _;
    }
}
