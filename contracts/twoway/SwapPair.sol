// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IBoringToken.sol";
import "../interface/ISwapPair.sol";
import "../lib/SafeDecimalMath.sol";
import "./struct.sol";

contract SwapPair is ERC20, Ownable, ISwapPair {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeDecimalMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;

    address public immutable override token0; // origin erc20 token

    uint256 public reserve0;

    EnumerableSet.UintSet private supportChainids;
    mapping(uint256 => uint256) public reserve1s;
    uint256 public totalReserve1s;

    address public twoWay;

    uint256 public immutable override diff0;

    event Mint(address indexed sender, uint256 amount);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, address indexed to);
    event TWoWayChanged(address indexed from, address indexed to);
    event SupportChaninidsAdded(uint256[] newChainids);
    event SupportChaninidsRemoved(uint256[] oldChainids);

    constructor(
        string memory _name,
        string memory _symbol,
        address _token0
    ) ERC20(_name, _symbol) {
        uint256 token0Decimals = IERC20Metadata(_token0).decimals();
        require(token0Decimals < 19, "token0 decimals too big");
        token0 = _token0;
        diff0 = 10**(18 - token0Decimals);
    }

    // ======view=====
    function getReserves(uint256 chainId) public view override returns (uint256, uint256) {
        return (reserve0, reserve1s[chainId]);
    }

    function getSupportChainIDs() external view returns(uint256[] memory) {
        uint[] memory chainids = new uint256[](supportChainids.length());
        for (uint i; i < supportChainids.length(); i++) {
            chainids[i] = supportChainids.at(i);
        }
        return chainids;
    }

    function setTwoWay(address _twoWay) external onlyOwner {
        emit TWoWayChanged(twoWay, _twoWay);
        twoWay = _twoWay;
    }

    function addChainIDs(uint256[] memory chainids) external override onlyTwoWay {
        for (uint256 i; i < chainids.length; i++) {
            supportChainids.add(chainids[i]);
        }
        emit SupportChaninidsAdded(chainids);
    }

    function removeChainIDs(uint256[] memory chainids) external override onlyTwoWay {
        for (uint256 i; i < chainids.length; i++) {
            supportChainids.remove(chainids[i]);
        }
        emit SupportChaninidsRemoved(chainids);
    }

    function mint(address to) external override onlyTwoWay returns (uint256 lpAmount) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 amount0 = balance0.sub(reserve0);

        lpAmount = getLPAmount(amount0);

        require(lpAmount > 0, "SwapPair: insufficient liquidity minted");

        _mint(to, lpAmount);

        // update reserves
        reserve0 = balance0;

        emit Mint(msg.sender, lpAmount);
    }

    function getLPAmount(uint256 amount) public view returns (uint256 lpAmount) {
        uint256 amountAdjust = amount * diff0;
        uint256 _reserve0 = reserve0 * diff0;
        uint256 total = totalSupply();
        if (total == 0) {
            lpAmount = amountAdjust;
        } else {
            lpAmount = (amountAdjust * total) / (totalReserve1s + _reserve0);
        }
    }

    function burn(
        address from,
        address to,
        uint256 lpAmount,
        address feeTo,
        uint256 feeAmount
    )
        external
        override
        onlyTwoWay
        returns (
            uint256,
            uint256[] memory,
            uint256[] memory
        )
    {
        (uint256 amount0, uint256[] memory chainids, uint256[] memory amount1s) = calculateBurn(lpAmount);
        IERC20(token0).transfer(from, amount0 - feeAmount);
        if (feeAmount > 0) {
            IERC20(token0).transfer(feeTo, feeAmount);
        }
        uint256 totalRemove;
        for (uint256 i; i < chainids.length; i++) {
            if (amount1s[i] > 0) {
                reserve1s[chainids[i]] -= amount1s[i];
                totalRemove += amount1s[i];
            }
        }

        _burn(from, lpAmount);

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        // update reserves
        reserve0 = balance0;
        totalReserve1s -= totalRemove;

        emit Burn(msg.sender, amount0, totalRemove, to);
        return (amount0, chainids, amount1s);
    }

    function calculateBurn(uint256 lpAmount)
        public
        view
        returns (
            uint256,
            uint256[] memory,
            uint256[] memory
        )
    {
        uint256 _reserve0 = reserve0 * diff0;
        uint256 _totalSupply = totalSupply();
        uint256 value = (lpAmount * (_reserve0 + totalReserve1s)) / _totalSupply;

        if (value <= _reserve0) {
            uint256 amount0 = value / diff0;
            uint256[] memory chainids = new uint256[](0);
            uint256[] memory amounts = new uint256[](0);
            return (amount0, chainids, amounts);
        } else {
            uint256 amount = value - _reserve0;
            uint256 chainidLength = supportChainids.length();
            uint256[] memory chainids = new uint256[](chainidLength);
            uint256[] memory amounts = new uint256[](chainidLength);
            for (uint256 i; i < chainidLength; i++) {
                uint256 chainid = supportChainids.at(i);
                if (reserve1s[chainid] >= amount) {
                    chainids[i] = chainid;
                    amounts[i] = amount;
                    break;
                } else {
                    chainids[i] = chainid;
                    amounts[i] = reserve1s[chainid];
                    amount = amount - reserve1s[chainid];
                }
            }
            return (reserve0, chainids, amounts);
        }
    }

    function update() external override onlyTwoWay {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        reserve0 = balance0;
    }

    function swapOut(
        address to,
        uint256 amount0,
        uint256 chainID
    ) external override onlyTwoWay onlySupportChainID(chainID) {
        (, uint256 _reserve1) = getReserves(chainID);

        require(_reserve1 >= amount0 * diff0, "SwapPair: insuffient liquidity");

        // IBoringToken(token1).burn(address(this), amount0 * diff0);
        reserve1s[chainID] -= amount0 * diff0;
        totalReserve1s -= amount0 * diff0;

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));

        reserve0 = balance0;

        emit Swap(msg.sender, amount0, amount0 * diff0, to);
    }

    function swapIn(SwapInParams memory params) external override onlyTwoWay onlySupportChainID(params.chainID) {
        uint256 _reserve0 = reserve0;

        require(_reserve0 >= params.amount1, "Insuffient liquidity");
        require(params.amount1 > 0, "Swap amount should be greater than 0");

        IERC20(token0).safeTransfer(params.to, params.remainAmount);
        if (params.feeAmountFix > 0) {
            IERC20(token0).safeTransfer(params.feeToDev, params.feeAmountFix);
        }
        // IBoringToken(token1).mint(address(this), amount1 * diff0);
        reserve1s[params.chainID] += params.amount1 * diff0;
        totalReserve1s += params.amount1 * diff0;

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));

        reserve0 = balance0;

        emit Swap(msg.sender, params.amount1 * diff0, params.amount1 * diff0, params.to);
    }

    modifier onlyTwoWay() {
        require(msg.sender == twoWay, "SwapPair: only twoWay can invoke it");
        _;
    }

    modifier onlySupportChainID(uint256 chainID) {
        require(supportChainids.contains(chainID), "not support chainID");
        _;
    }
}
