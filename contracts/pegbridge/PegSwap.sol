// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IPegSwapPair.sol";
import "../interface/IPegProxy.sol";

contract PegSwap is Ownable {
    using SafeMath for uint256;

    address public pegProxy;

    // origin token address => pair address
    // example: dai => pair(token0=dai, token1=borDAI)
    // mapping(address => address) public pairs;
    mapping(address => mapping(uint256 => address)) public pairs;

    mapping(address => uint256) removalMinimum;

    function setRemovalMinimum(address token0, uint256 minimum) public onlyOwner {
        removalMinimum[token0] = minimum;
    }

    function setPegProxy(address _pegProxy) public onlyOwner {
        pegProxy = _pegProxy;
    }

    function getPair(address token, uint256 chainID) public view onlySupportToken(token, chainID) returns (address) {
        return pairs[token][chainID];
    }

    function addPair(address token, address pair, uint256 chainID) public onlyOwner {
        require(pairs[token][chainID] == address(0), "PegSwap: token already supported");
        pairs[token][chainID] = pair;
    }

    function removePair(address token, uint256 chainID) public onlyOwner {
        require(pairs[token][chainID] != address(0), "PegSwap: token not supported");
        delete pairs[token][chainID];
    }

    function addLiquidity(
        address token0,
        uint256 chainID,
        uint256 amount,
        address to
    ) public onlySupportToken(token0, chainID) returns (uint256 liquidity) {
        address pair = getPair(token0, chainID);
        IERC20(token0).transferFrom(msg.sender, pair, amount);
        liquidity = IPegSwapPair(pair).mint(to);
    }

    function removeLiquidity(
        address token0,
        uint256 chainID,
        uint256 liquidity,
        address to
    ) public onlySupportToken(token0, chainID) returns (uint256 amount0, uint256 amount1) {
        require(removalMinimum[token0] < liquidity, "PegSwap: liquidity is less than minimum");
        address pair = getPair(token0, chainID);
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (amount0, amount1) = IPegSwapPair(pair).burn(msg.sender);

        if (amount1 > 0) {
            IPegProxy(pegProxy).burnBoringToken(msg.sender, token0, chainID, to, amount1);
        }
    }

    // token0 -> token1
    function swapToken0ForToken1(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) public onlySupportToken(token0, chainID) onlyPegProxy {
        require(amountIn > 0, "PegSwap: input must be greater than 0");
        address pair = getPair(token0, chainID);

        // transfer erc20 token to pair address
        IERC20(token0).transferFrom(msg.sender, pair, amountIn);
        IPegSwapPair(pair).swap(to, true);
    }

    // token1 -> token0
    function swapToken1ForToken0(
        address token0,
        uint256 chainID,
        uint256 amountIn,
        address to
    ) public onlySupportToken(token0, chainID) onlyPegProxy {
        require(amountIn > 0, "PegSwap: input must be greater than 0");
        address pair = getPair(token0, chainID);
        address token1 = IPegSwapPair(pair).token1();

        // transfer bor-erc20 token to pair address
        IERC20(token1).transferFrom(msg.sender, pair, amountIn);
        IPegSwapPair(pair).swap(to, false);
    }

    function getMaxToken1AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = getPair(token0, chainID);
        (, uint256 _reserve1) = IPegSwapPair(pair).getReserves();

        return _reserve1;
    }

    function getMaxToken0AmountOut(address token0, uint256 chainID) public view returns (uint256) {
        address pair = getPair(token0, chainID);
        (uint256 _reserve0, ) = IPegSwapPair(pair).getReserves();

        return _reserve0;
    }

    modifier onlySupportToken(address token, uint256 chainID) {
        require(pairs[token][chainID] != address(0), "PegSwap: not support this token");
        _;
    }

    modifier onlyPegProxy {
        require(msg.sender == pegProxy, "PegSwap: caller is not pegProxy");
        _;
    }
}
