// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";


contract BridgeNFT is IERC721Receiver, ERC721, Pausable, AccessControl, 
ERC721Burnable, ERC721URIStorage {
    // using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Counters.Counter private _tokenIdCounter;
    // mapping (uint256 => uint256) private _tokenLockId;

    string private _baseUri;
    
    // function initialize(string memory name, string memory symbol) public {
    //     __ERC721_init(name, symbol);
    //     _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    //     _setupRole(PAUSER_ROLE, _msgSender());
    //     _setupRole(MINTER_ROLE, _msgSender());
    //     _setupRole(BURNER_ROLE, _msgSender());
    // }
    
    constructor() ERC721("Bridge NFT", "BGNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }
    
    

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function safeMint(address to, uint256 tokenId_, string memory tokenURI_) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        _safeMint(to, tokenId_);
        _setTokenURI(tokenId_, tokenURI_);
        // _setTokenLockId(_tokenIdCounter.current(), tokenLockId_); 
        // _tokenIdCounter.increment();
    }
    
    // function _setTokenLockId(uint256 tokenId, uint256 tokenLockId_) internal virtual {
    //     require(_exists(tokenId), "ERC721: tokenLocker_ set of nonexistent token");
    //     _tokenLockId[tokenId] = tokenLockId_;
    // }

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

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        require(hasRole(BURNER_ROLE, _msgSender()));
        super._burn(tokenId);
    }

    // function approve(address to, uint256 tokenId) public override {
    //     super.approve(to, tokenId);
    // }

    function burn(uint256 tokenId) public override {
        _burn(tokenId);
        // if (_tokenLockId[tokenId] != 0) {
        //     delete _tokenLockId[tokenId];
        // }
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) 
            returns (string memory){
        return super.tokenURI(tokenId);
    }

    // function tokenLocker(uint256 tokenId) public view virtual returns (uint256) {
    //     require(_exists(tokenId), "ERC721Metadata: tokenLocker query for nonexistent token");
    //     return _tokenLockId[tokenId];
    // }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) 
            returns (bool){
        return super.supportsInterface(interfaceId);
    }
}