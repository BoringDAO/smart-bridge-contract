// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BridgeNFT is IERC721Receiver, ERC721, Pausable, AccessControl, 
ERC721Burnable, ERC721Enumerable{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    string private _baseUri;
    
    constructor() ERC721("Bridge NFT", "BGNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }
    
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function safeMint(address to, uint256 tokenId_) public {
        require(hasRole(MINTER_ROLE, _msgSender()));
        _safeMint(to, tokenId_);
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

    function _burn(uint256 tokenId) internal override(ERC721) {
        require(hasRole(BURNER_ROLE, _msgSender()));
        super._burn(tokenId);
    }

    function burn(uint256 tokenId) public override {
        _burn(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721, ERC721Enumerable){
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721, AccessControl) 
            returns (bool){
        return super.supportsInterface(interfaceId);
    }
}