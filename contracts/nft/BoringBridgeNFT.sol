// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../lib/SafeDecimalMath.sol";
import "../ProposalVote.sol";


contract BoringBridgeNFT is ProposalVote, IERC721Receiver, ERC721, Pausable, AccessControl, 
ERC721Burnable, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant CROSSER_ROLE = keccak256("CROSSER_ROLE");
    
    
    string private _baseUri;
    
    struct tokenInfo{
        address token;
        uint256 chainId;
        uint256 tokenId;
    }
    
    mapping(uint256 => tokenInfo) public tokenIdInfo;
    mapping(address => uint256 ) public supportToken;
    mapping(address => bool) public isCurrentChain;
    mapping(string => bool) public txMinted;
    
    constructor() ERC721("Boring Bridge NFT", "BBNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        _setupRole(CROSSER_ROLE, _msgSender()); 
    }
    
    
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
    

    event CrossOut(
        address originToken0,
        uint256 originChainId,
        uint256 originTokenId,
        string originTokenUri,
        uint256 targetChainID, 
        address from,
        address to);

    event CrossIn(
        uint256 targetTokenId,
        address from,
        address to, 
        string txid
    );

    function crossOut(
        address token0, 
        uint256 chainID, 
        address to, 
        uint256 tokenId) onlySupportToken(token0, chainID) public {
        require(to != address(0), "NFT to is empty");
        
        if (isCurrentChain[token0]) {
            string memory tokenUri = IERC721Metadata(token0).tokenURI(tokenId);
            IERC721(token0).safeTransferFrom(msg.sender, address(this), tokenId);

            emit CrossOut(token0, chainID, tokenId, tokenUri, chainID, msg.sender, to);
        }else{
            string memory tokenUri = tokenURI(tokenId);
            burn(tokenId);

            emit CrossOut(
                tokenIdInfo[tokenId].token,
                tokenIdInfo[tokenId].chainId,
                tokenIdInfo[tokenId].tokenId,
                tokenUri,
                chainID,
                msg.sender,
                to
                );
        }

    }
    
    function crossIn(
        tokenInfo memory origin,
        string memory originTokenUri,
        address from,
        address to,
        string memory txid
    ) public whenNotMinted(txid) {
        bool result = _vote(origin.token, from, to, origin.tokenId, txid);
        if(result){
            txMinted[txid] = true;
            if(isCurrentChain[origin.token]){
                IERC721(origin.token).safeTransferFrom(address(this), to, origin.tokenId);
                emit CrossIn(origin.tokenId, from, to, txid);
            }else{
                uint256 tokenId = safeMint(to, originTokenUri);
                tokenInfo memory tokenInfo_ = tokenInfo(address(this), block.chainid, tokenId);
                tokenIdInfo[tokenId] = tokenInfo_;
                emit CrossIn(tokenId, from, to, txid);
            }
        } 
    }
    
    function addSupportToken(
        address token0,
        uint256 chainID
    ) public onlyAdmin {
        require(supportToken[token0] == 0, "NFT Bridge: Token already Supported");
        supportToken[token0] = chainID;
    }

    function safeMint(address to, string memory tokenURI_) public returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()));
        uint256 tokenId = _tokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _tokenIds.increment();
        return tokenId;
    }

    function pause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()));
        _pause();
    }

    function unpause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()));
        _unpause();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }

    function setBaseURI(string memory baseURI_) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()));
        _baseUri = baseURI_;
    }


    function setThreshold(address token0, uint256 _threshold) public onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        require(hasRole(BURNER_ROLE, _msgSender()));
        super._burn(tokenId);
    }

    function burn(uint256 tokenId) public override onlyBurner() {
        _burn(tokenId);
        delete tokenIdInfo[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) 
            returns (string memory){
        return super.tokenURI(tokenId);
    }

    function tokenINFO(uint256 tokenId) public view returns(tokenInfo memory){
        return tokenIdInfo[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) 
            returns (bool){
        return super.supportsInterface(interfaceId);
    }
    
    modifier onlySupportToken(address token0, uint256 chainID) {
        require(supportToken[token0] == chainID, "Lock::Not Support Token");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "caller is not admin");
        _;
    }
    
    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "caller is not burner");
        _;
    }
    
    
    modifier onlyCrosser() {
        require(hasRole(CROSSER_ROLE, msg.sender), "BridgeNFT: caller is not crosser");
        _;
    }
    
    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "BridgeNFT: tx minted");
        _;
    }

    function setIsCurrentChain(address token) onlyAdmin public {
        isCurrentChain[token] = true;
    }

    function removeIsCurrentChain(address token) onlyAdmin public {
        isCurrentChain[token] = false;
    }
}