// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../struct/NCrossInParams.sol";

interface INB {
    function crossOut(
        address _token,
        uint256 toChainID,
        address to,
        uint256 amount
    ) external;

    function crossIn(NCrossInParams memory p) external;
}

contract Attack {
    fallback() external payable {
        
    }

    function attack() external payable {}
}
