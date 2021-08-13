// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IBoringToken.sol";
import "../interface/ISwapPair.sol";
import "../lib/SafeDecimalMath.sol";

contract SwapPair is ERC20, Ownable, ISwapPair {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeDecimalMath for uint256;

    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    address public override token0; // origin erc20 token
    address public override token1; // bor-erc20 token

    uint256 private reserve0;
    uint256 private reserve1;

    address public twoWay;

    uint256 public bRatio = 3;

    uint256 public override diff0;

    event Mint(address indexed sender, uint256 amount);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(
        string memory _name,
        string memory _symbol,
        address _token0,
        address _token1
    ) ERC20(_name, _symbol) {
        uint256 token0Decimals = IERC20Metadata(_token0).decimals();
        require(token0Decimals < 19, "token0 decimals too big");
        token0 = _token0;
        token1 = _token1;
        diff0 = 10**(18 - token0Decimals);
    }

    function setBRatio(uint256 _ratio) external onlyOwner {
        bRatio = _ratio;
    }

    function setTwoWay(address _twoWay) external onlyOwner {
        twoWay = _twoWay;
    }

    function getReserves() public view override returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    function mint(address to) external override onlyTwoWay returns (uint256 lpAmount) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        // uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        amount0 *= diff0;
        _reserve0 *= diff0;
        uint256 total = totalSupply();
        if (total == 0) {
            lpAmount = amount0;
        } else {
            lpAmount = (amount0 * totalSupply()) / (_reserve0 + _reserve1);
        }

        require(lpAmount > 0, "SwapPair: insufficient liquidity minted");

        _mint(to, lpAmount);

        // update reserves
        reserve0 = balance0;

        emit Mint(msg.sender, lpAmount);
    }

    function burn(
        address from,
        address to,
        uint256 lpAmount,
        address feeTo,
        uint256 feeAmount
    ) external override onlyTwoWay returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = calculateBurn(lpAmount);
        IERC20(token0).transfer(to, amount0 - feeAmount);
        if (feeAmount > 0) {
            IERC20(token0).transfer(feeTo, feeAmount);
        }
        if (amount1 > 0) {
            IBoringToken(token1).burn(address(this), amount1);
        }

        _burn(from, lpAmount);

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        // update reserves
        reserve0 = balance0;
        reserve1 = balance1;

        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
    amount0's decimal is different when token0's decimal is not 18
     */
    function calculateBurn(uint256 lpAmount) public view returns (uint256 amount0, uint256 amount1) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();

        _reserve0 *= diff0;

        uint256 _totalSupply = totalSupply();
        uint256 value = (lpAmount * (_reserve0 + _reserve1)) / _totalSupply;

        // 75%
        if (_reserve1.mul(bRatio) < _reserve0) {
            if (value > _reserve0) {
                amount0 = reserve0;
                amount1 = value - _reserve0;
            } else {
                amount0 = value / diff0;
                amount1 = 0;
            }
        } else {
            amount0 = lpAmount.mul(reserve0).div(_totalSupply);
            amount1 = lpAmount.mul(_reserve1).div(_totalSupply);
        }
    }

    function update() external override onlyTwoWay {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        reserve0 = balance0;
        reserve1 = balance1;
    }

    function swapOut(address to, uint256 amount0) external override onlyTwoWay {
        (, uint256 _reserve1) = getReserves();

        require(_reserve1 >= amount0 * diff0, "SwapPair: insuffient liquidity");

        IBoringToken(token1).burn(address(this), amount0 * diff0);

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        reserve0 = balance0;
        reserve1 = balance1;

        emit Swap(msg.sender, amount0, amount0 * diff0, to);
    }

    function swapIn(
        address to,
        uint256 amount1,
        uint256 feeAmountFix,
        uint256 remainAmount,
        address feeToDev
    ) external override onlyTwoWay {
        (uint256 _reserve0, ) = getReserves();

        require(_reserve0 >= amount1, "Insuffient liquidity");
        require(amount1 > 0, "Swap amount should be greater than 0");

        IERC20(token0).safeTransfer(to, remainAmount);
        if (feeAmountFix > 0) {
            IERC20(token0).safeTransfer(feeToDev, feeAmountFix);
        }
        IBoringToken(token1).mint(address(this), amount1 * diff0);

        // current balance
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        reserve0 = balance0;
        reserve1 = balance1;

        emit Swap(msg.sender, amount1 * diff0, amount1 * diff0, to);
    }

    modifier onlyTwoWay() {
        require(msg.sender == twoWay, "SwapPair: only twoWay can invoke it");
        _;
    }
}
