// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interface/IToken.sol";

contract NBridge {

	using SafeERC20 for IToken;


	uint public chainId ;

	struct TokenInfo {
		uint tokenType;
		address mirrorAddress;
		uint mirrorChainId;
		bool isSupported;
	}

	mapping(uint256 => mapping(address => TokenInfo)) public supportedTokens;

	constructor(uint _chainId) {
		chainId = _chainId;
	}
	
	function addSupportToken(uint _chainId, address _token, TokenInfo memory ti) public {
		require(_token != address(0), "error token address");
		// require(supportedTokens[_chainId][_token].isSupported = false, "Token already supported");
		require(ti.isSupported == true, "params error");
		supportedTokens[_chainId][_token] = ti;
	}

	function addMultiSupportTokens(uint[] memory _chainIds, address[] memory _tokens, TokenInfo[] memory tis) external {
		uint tokenLength = _tokens.length;
		require(tokenLength == tis.length, "length not match");
		for (uint i; i < tokenLength; i++) {
			addSupportToken(_chainIds[i], _tokens[i], tis[i]);
		}
	}



	event CrossOut(address originToken, uint originChainId, uint fromChainId, uint toChainId, address from, address to, uint amount);
	event CrossIn(address originToken, uint originChainId, uint fromChainId, uint toChainId, address from, address to, uint amount);

	function crossOut(address _token, uint toChainID, address to, uint amount) external {
		TokenInfo memory ti = supportedTokens[chainId][_token];
		require(ti.isSupported, "not support token") ;
		if (ti.tokenType == 1) {
			// lock
			IToken(_token).safeTransferFrom(msg.sender, address(this), amount);
			emit CrossOut(_token, chainId, chainId, toChainID, msg.sender, to, amount);
		}  else if (ti.tokenType == 2) {
			// burn
			IToken(_token).burn(msg.sender, amount);
			emit CrossOut(ti.mirrorAddress, ti.mirrorChainId, chainId, toChainID, msg.sender, to, amount);
		}
	}

	function crossIn(address _originToken, uint _originChainId, uint fromChainId, uint toChainId, address from , address to, uint amount) external {
		require(toChainId == chainId, "chainId error");
		TokenInfo memory ti = supportedTokens[_originChainId][_originToken];
		require(ti.isSupported, "not support token") ;
		if (ti.tokenType == 1) {
			// lock
			IToken(ti.mirrorAddress).safeTransferFrom(address(this), to, amount);
		}  else if (ti.tokenType == 2) {
			// mint
			IToken(ti.mirrorAddress).mint(to, amount);
		}
		emit CrossIn(_originToken, _originChainId, fromChainId, toChainId, from, to, amount);
	}
}