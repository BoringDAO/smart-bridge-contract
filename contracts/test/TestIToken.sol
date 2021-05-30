// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestITokenETH is ERC20, Ownable{
    address public minter;
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, 1000 * 10**18);
    }

    function mint(address to, uint amount) external returns(bool) {
        _mint(to, amount);
        return true;
    }
    
    function burn(address to, uint amount) external returns(bool) {
        _burn(to, amount);
        return true;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "only minter");
        _;
    }
}

contract TestITokenBSC is ERC20, Ownable{
    address public minter;
    constructor(
        string memory _name,
        string memory _symbol,
        address _minter
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, 1000 * 10**18);
        minter = _minter;
    }

    function mint(address to, uint amount) external onlyMinter returns(bool) {
        _mint(to, amount);
        return true;
    }
    
    function burn(address to, uint amount) external onlyMinter returns(bool) {
        _burn(to, amount);
        return true;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "only minter");
        _;
    }

}
