// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "../../interface/IStakingReward.sol";
import "../../lib/SafeDecimalMath.sol";
import "./IChef.sol";

contract TwoWayChef is Initializable, AccessControlUpgradeable, UUPSUpgradeable, IChef {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeDecimalMath for uint256;

    struct UserInfo {
        uint256 depositAmount;
        uint256 rewardDebt;
    }
    struct PoolInfo {
        IERC20Upgradeable depositToken;
        uint256 allocPoint;
        uint256 lastRewardTS;
        uint256 accRewardPerShare;
    }

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20Upgradeable public rewardToken;
    address public dispatcher;
    uint256 public totalAllocPoint;
    uint256 public rewardPerSecond;
    uint256 public startTS;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    mapping(uint256 => IStakingReward) public stakingRewards;
    mapping(uint => uint) public totalDeposit;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address _rewardToken,
        address _dispatcher,
        uint256 _rewardPerSecond,
        uint256 _startTS
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        rewardToken = IERC20Upgradeable(_rewardToken);
        dispatcher = _dispatcher;
        rewardPerSecond = _rewardPerSecond;
        startTS = _startTS;
    }

    function depositTokenAmount(uint256 _pid, address user) external view override returns (uint supply, uint userAmount) {
        // supply = poolInfo[_pid].depositToken.balanceOf(address(this));
        supply = totalDeposit[_pid];
        userAmount = userInfo[_pid][user].depositAmount;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function setDispather(address _dispather) external onlyRole(DEFAULT_ADMIN_ROLE) {
        dispatcher = _dispather;
    }

    function setStakingReward(uint256 _pid, IStakingReward isr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingRewards[_pid] = isr;
    }

    function dispatcherTransfer(address _to, uint256 _amount) internal {
        rewardToken.safeTransferFrom(dispatcher, _to, _amount);
    }

    function pendingReward(uint256 _pid, address _user) public view returns (uint256 pending) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 arp = pool.accRewardPerShare;
        // uint256 totalDeposit = pool.depositToken.balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTS && totalDeposit[_pid] != 0) {
            uint256 period = block.timestamp - pool.lastRewardTS;
            uint256 reward = (period * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
            arp += reward.divideDecimal(totalDeposit[_pid]);
        }
        pending = user.depositAmount.multiplyDecimal(arp) - user.rewardDebt;
    }

    function earned(uint256 _pid, address user) external view returns (uint256, uint256) {
        return (pendingReward(_pid, user), stakingRewards[_pid].earned(user));
    }

    function perSecond(uint256 _pid) external view returns (uint256, uint256) {
        return (rewardPerSecond, stakingRewards[_pid].rewardRate());
    }

    function deposit(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.depositAmount > 0) {
            uint256 pending = user.depositAmount.multiplyDecimal(pool.accRewardPerShare) - user.rewardDebt;
            dispatcherTransfer(msg.sender, pending);
        }
        // update debt
        if (_amount > 0) {
            pool.depositToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.depositAmount += _amount;
            totalDeposit[_pid] += _amount;
        }

        user.rewardDebt = user.depositAmount.multiplyDecimal(pool.accRewardPerShare);
        emit Deposited(msg.sender, _pid, _amount);
        
        chefReward(_pid);
    }

    function chefReward(uint256 _pid) internal {
        if (address(stakingRewards[_pid]) != address(0)) {
            stakingRewards[_pid].onChefReward(msg.sender);
        }
    }

    function withdraw(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "withdraw amount should > 0");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.depositAmount >= _amount, "withdraw: not enough");
        updatePool(_pid);
        uint256 pending = user.depositAmount.multiplyDecimal(pool.accRewardPerShare) - user.rewardDebt;
        if (pending > 0) {
            dispatcherTransfer(msg.sender, pending);
        }
        user.depositAmount -= _amount;
        user.rewardDebt = user.depositAmount.multiplyDecimal(pool.accRewardPerShare);
        pool.depositToken.safeTransfer(msg.sender, _amount);
        totalDeposit[_pid] -= _amount;
        chefReward(_pid);

        emit Withdrawed(msg.sender, _pid, _amount);
    }

    function addPool(
        uint256 _allocPoint,
        address _depositToken,
        bool _withUpdate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 _lastRewardTS = block.timestamp > startTS ? block.timestamp : startTS;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(
            PoolInfo({
                depositToken: IERC20Upgradeable(_depositToken),
                allocPoint: _allocPoint,
                lastRewardTS: _lastRewardTS,
                accRewardPerShare: 0
            })
        );
        emit PoolAdded(poolInfo.length - 1, _allocPoint, _depositToken);
    }

    function setPool(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        emit AllocPointChanged(_pid, _allocPoint);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTS) {
            return;
        }
        // uint256 totalDeposit = pool.depositToken.balanceOf(address(this));
        if (totalDeposit[_pid] == 0) {
            pool.lastRewardTS = block.timestamp;
            return;
        }
        uint256 period = block.timestamp - pool.lastRewardTS;
        uint256 reward = (period * rewardPerSecond * pool.allocPoint) / totalAllocPoint;
        pool.accRewardPerShare += reward.divideDecimal(totalDeposit[_pid]);
        pool.lastRewardTS = block.timestamp;
    }

    function updateRewardPerSecond(uint256 _rewardPerSecond, bool withUpdate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (withUpdate) {
            massUpdatePools();
        }
        rewardPerSecond = _rewardPerSecond;
        // emit NewRewardPerSecond(_rewardPerSecond);
    }

    event Deposited(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdrawed(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 pid, uint256 point, address _depositToken);
    event AllocPointChanged(uint256 pid, uint256 point);
}
