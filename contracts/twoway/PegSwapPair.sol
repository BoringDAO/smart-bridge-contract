// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PegSwapPair is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    address public token0; // origin erc20 token
    address public token1; // bor-erc20 token

    uint256 private reserve0;
    uint256 private reserve1;

    address public pegSwap;

    event Mint(address indexed sender, uint256 amount);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {}

    function setPegSwap(address _pegSwap) external onlyOwner {
        pegSwap = _pegSwap;
    }

    // called once by the owner at time of deployment
    function initialize(address _token0, address _token1) external onlyOwner {
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() public view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    function mint(address to) external returns (uint256 liquidity) {
        (uint256 _reserve0, ) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);

        // x + y = k, obtaining liquidity is equal to amount
        liquidity = amount0;
        require(liquidity > 0, "PegSwapPair: insufficient liquidity minted");

        _mint(to, liquidity);

        // update reserves
        reserve0 = balance0;

        emit Mint(msg.sender, amount0);
    }

    function burn(address to) external returns (uint256 amount0, uint256 amount1) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();
        address _token0 = token0;
        address _token1 = token1;

        uint256 _totalSupply = totalSupply();
        uint256 _liquidity = balanceOf(address(this));

        uint256 liquidity = _liquidity.mul(997).div(1000);

        // 75%
        if (_reserve1.mul(3) < _reserve0) {
            amount0 = liquidity;
            amount1 = 0;
        } else {
            amount0 = liquidity.mul(_reserve0).div(_totalSupply);
            amount1 = liquidity.mul(_reserve1).div(_totalSupply);
        }


        IERC20(_token0).transfer(to, amount0);
        IERC20(_token1).transfer(to, amount1);
        _burn(address(this), liquidity);
        // current balance
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        // update reserves
        reserve0 = balance0;
        reserve1 = balance1;

        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(address to, bool direction) public onlyPegSwap {
        // token0 -> token1
        if (direction) {
            _swapToken0ForToken1(to);
        } else {
            _swapToken1ForToken0(to);
        }
    }

    function _swapToken0ForToken1(address to) internal {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();

        address _token0 = token0;
        address _token1 = token1;

        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);

        require(amount0 > 0, "PegSwapPair: swap amount should be greater than 0");
        require(_reserve1 >= amount0, "PegSwapPair: insuffient liquidity");

        IERC20(_token1).transfer(to, amount0);

        // current balance
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));

        reserve0 = balance0;
        reserve1 = balance1;

        emit Swap(msg.sender, amount0, amount0, to);
    }

    function _swapToken1ForToken0(address to) internal {
        (uint256 _reserve0, uint256 _reserve1) = getReserves();

        address _token0 = token0;
        address _token1 = token1;

        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 amount1 = balance1.sub(_reserve1);
        require(_reserve0 >= amount1, "Insuffient liquidity");
        require(amount1 > 0, "Swap amount should be greater than 0");

        IERC20(_token0).transfer(to, amount1);

        // current balance
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));

        reserve0 = balance0;
        reserve1 = balance1;

        emit Swap(msg.sender, amount1, amount1, to);
    }

    modifier onlyPegSwap {
        require(msg.sender == pegSwap, "PegSwapPair: only pegSwap can invoke it");
        _;
    }
}
