// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";


import "../lib/SafeDecimalMath.sol";
import "../ProposalVote.sol";

contract NFTBridgeUUPS is Initializable, ProposalVote, IERC721ReceiverUpgradeable, ERC721Upgradeable, PausableUpgradeable, AccessControlUpgradeable, ERC721URIStorageUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, ERC721EnumerableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor

    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;

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
    mapping(address => mapping(uint256 => bool) ) public supportToken;
    mapping(address => bool) public isCurrentChain;
    mapping(string => bool) public txMinted;

    function initialize() initializer public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        _setupRole(CROSSER_ROLE, _msgSender()); 
        __ERC721_init("NFT Bridge", "NBG");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __Pausable_init();
        __Ownable_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal onlyOwner override {}


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
        require(to != address(0), "address to is empty");
        
        if (isCurrentChain[token0]) {
            string memory tokenUri = IERC721MetadataUpgradeable(token0).tokenURI(tokenId);
            IERC721Upgradeable(token0).safeTransferFrom(msg.sender, address(this), tokenId);
            emit CrossOut(token0, block.chainid, tokenId, tokenUri, chainID, msg.sender, to);
        }else{
            string memory tokenUri = tokenURI(tokenId);
            emit CrossOut(
                tokenIdInfo[tokenId].token,
                tokenIdInfo[tokenId].chainId,
                tokenIdInfo[tokenId].tokenId,
                tokenUri,
                chainID,
                msg.sender,
                to
                );
            burn(tokenId);
        }
    }


    function crossIn(
        tokenInfo memory origin,
        string memory originTokenUri,
        address from,
        address to,
        string memory txid
    ) public onlyCrosser() whenNotMinted(txid) {
        bool result = _vote(origin.token, from, to, origin.tokenId, txid);
        if(result){
            txMinted[txid] = true;
            if(isCurrentChain[origin.token]){
                IERC721Upgradeable(origin.token).safeTransferFrom(address(this), to, origin.tokenId);
                emit CrossIn(origin.tokenId, from, to, txid);
            }else{
                uint256 tokenId = safeMint(to, originTokenUri);
                tokenIdInfo[tokenId] = origin;
                emit CrossIn(tokenId, from, to, txid);
            }
        } 
    }

    function addSupportToken(
        address token0,
        uint256 chainID
    ) public onlyAdmin {
        require(supportToken[token0][chainID] == false, "NFT Bridge: Token already Supported");
        supportToken[token0][chainID] = true;
    }

    function removeSupportToken(
        address token0,
        uint256 chainID
    ) public onlyAdmin {
        require(supportToken[token0][chainID] != false, "NFT Bridge: token not supported");
        delete supportToken[token0][chainID];
    }

    function safeMint(address to, string memory tokenURI_) public returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()), "NFT Bridge: caller is not burner");
        uint256 tokenId = _tokenIds.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _tokenIds.increment();
        return tokenId;
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function pause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "NFT Bridge: caller is not pauser");
        _pause();
    }

    function unpause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "NFT Bridge: caller is not pauser");
        _unpause();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }

    function setBaseURI(string memory baseURI_) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),"NFT Bridge: caller is not admin");
        _baseUri = baseURI_;
    }


    function setThreshold(address token0, uint256 _threshold) public onlyAdmin {
        _setThreshold(token0, _threshold);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        require(hasRole(BURNER_ROLE, _msgSender()),"NFT Bridge: caller is not burner");
        super._burn(tokenId);
    }

    function burn(uint256 tokenId) public override onlyBurner() {
        _burn(tokenId);
        delete tokenIdInfo[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) 
            returns (string memory){
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable, ERC721EnumerableUpgradeable) 
            returns (bool){
        return super.supportsInterface(interfaceId);
    }
    
    modifier onlySupportToken(address token0, uint256 chainID) {
        require(supportToken[token0][chainID] == true, "NFT Bridge: Not Support Token");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NFT Bridge: caller is not admin");
        _;
    }
    
    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "NFT Bridge: caller is not burner");
        _;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal whenNotPaused override(ERC721Upgradeable, ERC721EnumerableUpgradeable){
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
    modifier onlyCrosser() {
        require(hasRole(CROSSER_ROLE, msg.sender), "NFT Bridge: caller is not crosser");
        _;
    }
    
    modifier whenNotMinted(string memory _txid) {
        require(txMinted[_txid] == false, "NFT Bridge: tx minted");
        _;
    }

    function setCurrentChainToken(address token) onlyAdmin public {
        isCurrentChain[token] = true;
    }

    function removeCurrentChainToken(address token) onlyAdmin public {
        isCurrentChain[token] = false;
    }
}