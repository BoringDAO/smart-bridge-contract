// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// import "../interface/ISwapPair.sol";
// import "../interface/IBoringToken.sol";
import "../ProposalVote.sol";
import "../interface/IToken.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TwParams.sol";

contract TwoWayCenter is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ProposalVote {
	using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant CROSSER_ROLE = keccak256("CROSSER_ROLE");

	uint public chainid;
	mapping(uint => mapping(address => address)) public toCenterToken;
	mapping(address => mapping(uint => address)) public toEdgeToken;
	mapping(address => uint) public decimalDiff;
	mapping(string => bool) public txHandled;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(uint _chainid) initializer public {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
		chainid = _chainid;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

	function addToken(address _centerToken, uint _edgeChainId, address _edgeToken) external onlyAdmin {
		require(toCenterToken[_edgeChainId][_edgeToken] == address(0), "centerToken exist");
		require(toEdgeToken[_centerToken][_edgeChainId] == address(0), "edgeToken exist");
		toCenterToken[_edgeChainId][_edgeToken] = _centerToken;
		toEdgeToken[_centerToken][_edgeChainId] = _edgeToken;
		decimalDiff[_centerToken] = 10 ** (18 - IERC20MetadataUpgradeable(_centerToken).decimals());
	}

	function removeToken(address _centerToken, uint _edgeChainId, address _edgeToken) external onlyAdmin {
		require(toCenterToken[_edgeChainId][_edgeToken] != address(0), "centerToken exist");
		require(toEdgeToken[_centerToken][_edgeChainId] != address(0), "edgeToken exist");
		delete toCenterToken[_edgeChainId][_edgeToken];
		delete toEdgeToken[_centerToken][_edgeChainId];
	}

	function deposit(address token, uint amount) external {
		address centerToken = toCenterToken[chainid][token];
		require(centerToken!= address(0), "not support");
		IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
		IToken(centerToken).mint(msg.sender, amount * decimalDiff[token]);
		emit CenterDeposited(chainid, token, amount * decimalDiff[token]);
	}

	function crossOut(address fromToken, uint toChainId, address to, uint amount) external {
		address _centerToken = toCenterToken[chainid][fromToken];
		require( _centerToken != address(0), "not support");
		address _edgeToken = toEdgeToken[_centerToken][toChainId];
		require(_edgeToken != address(0), "not support");
		IERC20Upgradeable(fromToken).safeTransferFrom(msg.sender, address(this), amount);
		emit CrossOuted(OutParam(chainid, fromToken, msg.sender, toChainId, to, amount * decimalDiff[fromToken]));
	}

	function crossIn(InParam memory p, string memory txid) external onlyCrosser whenNotHandled(txid) {
		require(p.toChainId == chainid, "chainid error");
		require(toCenterToken[chainid][p.toToken] != address(0), "not support");
		bool result = _vote(p.toToken, p.from, p.to, p.amount, txid);
		if (result) {
			txHandled[txid] = true;
			uint amountAdjust = p.amount / decimalDiff[p.toToken];
			if (IERC20Upgradeable(p.toToken).balanceOf(address(this)) >= amountAdjust) {
				IERC20Upgradeable(p.toToken).safeTransfer(p.to, amountAdjust);
				emit CrossIned(p);
			} else {
				emit CrossInFailed(p);
			}
		}
	}

	function issue(InParam memory tp, string memory txid) external onlyRole(CROSSER_ROLE) whenNotHandled(txid){
		address _centerToken = toCenterToken[tp.fromChainId][tp.fromToken];
		require( _centerToken != address(0), "centerToken exist");
		require(toEdgeToken[_centerToken][tp.fromChainId] != address(0), "edgeToken exist");
		bool result = _vote(tp.fromToken, tp.from, tp.to, tp.amount, txid);
		if (result) {
			txHandled[txid] = true;
			IToken twt = IToken(_centerToken);
			twt.mint(tp.to, tp.amount);
			emit Issued(address(twt), tp.to, tp.amount);
		}
	}


	function rollbackCrossIn(InParam memory p, string memory txid) external onlyRole(CROSSER_ROLE) whenNotHandled(txid) {
		require(p.toChainId == chainid, "chainid error");
		require(toCenterToken[chainid][p.toToken] != address(0), "not support");
		bool result = _vote(p.toToken, p.from, p.to, p.amount, txid);
		if (result) {
			txHandled[txid] = true;
			address _centerToken = toCenterToken[p.fromChainId][p.fromToken];
			IToken twt = IToken(_centerToken);
			twt.mint(p.to, p.amount);
			emit RollbackCrossIned(p);
		}
	}

	/// twt => two way token
	function withdraw(address fromToken, uint toChainId, address to, uint amount) external {
		if (toChainId == chainid) {
			address _centerToken = toCenterToken[toChainId][fromToken];
			require(IERC20Upgradeable(_centerToken).balanceOf(address(this)) >= amount, "not enough");
			IERC20Upgradeable(_centerToken).safeTransfer(msg.sender, amount);
		} else {
			
		}
		IToken(fromToken).burn(msg.sender, amount);
		// emit CrossOuted(token, amount, toChainId);
		emit Withdrawed(OutParam(chainid, fromToken, msg.sender, toChainId,  to, amount));
	}

	 modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "TwoWay: caller is not admin");
        _;
    }

    modifier onlyCrosser() {
        require(hasRole(CROSSER_ROLE, msg.sender), "TwoWay: caller is not crosser");
        _;
    }

	modifier whenNotHandled(string memory _txid) {
        require(txHandled[_txid] == false, "TwoWay: tx minted");
        _;
    }

	event Deposited(address token, uint amount);
	event Withdrawed(OutParam p);
	event CenterDeposited(uint fromChainId, address token, uint amount);
	event CrossOuted(OutParam p);
	event TwtCrossOuted();
	event CrossIned(InParam p);
	event CrossInFailed(InParam p);
	event RollbackCrossIned(InParam p);
	event Supported(address token, uint chainId, bool status);
	event Issued(address token, address to, uint amount);
}