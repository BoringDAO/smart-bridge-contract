// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../lib/SafeDecimalMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TwoWayFeePool {
    using SafeDecimalMath for uint;
    using SafeERC20 for IERC20;

    IERC20 public stakeToken;
    IERC20 public rewardToken;
    address public twoWay;

    uint public rewardPerTokenStored;

    mapping(address => uint) public userReward;
    mapping(address => uint) public userRewardPaid;

    mapping(address => uint) public balanceOf;

    constructor(address _stakeToken, address _rewardToken, address _twoWay) {
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        twoWay = _twoWay;
    }

    function earned(address account) public view returns(uint) {
        uint reward = balanceOf[account].multiplyDecimal(rewardPerTokenStored-userRewardPaid[account]) + userReward[account]; 
        return reward;
    }

    function notify(uint amount) external onlyTwoWay {
        rewardPerTokenStored = rewardPerTokenStored + amount.divideDecimal(stakeToken.balanceOf(address(this)));
        emit NotifyReward(amount);
    }

    function stake(address account, uint amount) external {
        uint reward = earned(account);
        userReward[account] = reward;
        userRewardPaid[account] = rewardPerTokenStored;
        balanceOf[account] += amount;
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit StakeLP(account, reward);
    }

    function withdraw(uint amount) external {
        require(balanceOf[msg.sender] >= amount, "Not Enough LP");
        claim();
        stakeToken.safeTransfer(msg.sender, amount);
        emit Withdrawed(msg.sender, amount);
    }

    function claim() public {
        uint reward = earned(msg.sender);
        userReward[msg.sender] = 0;
        userRewardPaid[msg.sender] = rewardPerTokenStored;
        rewardToken.safeTransfer(msg.sender, reward);
        emit Claimed(msg.sender, reward);
    }

    modifier onlyTwoWay {
        require(msg.sender == twoWay, "only TwoWay");
        _;
    }

    event NotifyReward(uint amount);
    event StakeLP(address account, uint amount);
    event Withdrawed(address account, uint amount);
    event Claimed(address account, uint amount);

}
