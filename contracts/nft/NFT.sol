// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";


contract NFT is IERC721ReceiverUpgradeable, ERC721Upgradeable, PausableUpgradeable, AccessControlUpgradeable, 
ERC721BurnableUpgradeable, ERC721URIStorageUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping (uint256 => uint256) private _tokenOrders;

    string private _baseUri;
    
    function initialize(string memory name, string memory symbol) public {
        __ERC721_init(name, symbol);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function safeMint(address to, string memory tokenURI_, uint256 tokenOrder_) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        _safeMint(to, _tokenIdCounter.current());
        _setTokenURI(_tokenIdCounter.current(), tokenURI_);
        _setTokenOrder(_tokenIdCounter.current(), tokenOrder_); 
        _tokenIdCounter.increment();
    }
    
    function _setTokenOrder(uint256 tokenId, uint256 tokenOrder_) internal virtual {
        require(_exists(tokenId), "ERC721: tokenOrder_ set of nonexistent token");
        _tokenOrders[tokenId] = tokenOrder_;
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

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        require(hasRole(BURNER_ROLE, _msgSender()));
        super._burn(tokenId);
    }

    function approve(address to, uint256 tokenId) public virtual override {
        super.approve(to, tokenId);
    }

    function burn(uint256 tokenId) public override {
        _burn(tokenId);
        if (_tokenOrders[tokenId] != 0) {
            delete _tokenOrders[tokenId];
        }
    }

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) 
            returns (string memory){
        return super.tokenURI(tokenId);
    }

    function tokenOrder(uint256 tokenId) public view virtual returns (uint256) {
        require(_exists(tokenId), "ERC721Metadata: tokenOrder query for nonexistent token");
        return _tokenOrders[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) 
            returns (bool){
        return super.supportsInterface(interfaceId);
    }
}