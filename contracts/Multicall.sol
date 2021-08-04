// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Address.sol";

contract Multicall {
    struct Call {
        address target;
        bytes callData;
    }

    /**
        @notice Use cases:
            - calling functions that don't modify the storage
            - inherit from this contract and use this for calls to the same contract
     */
    function multiDelegateCall(Call[] calldata calls) external returns (bytes[] memory results) {
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            results[i] = Address.functionDelegateCall(calls[i].target, calls[i].callData);
        }
        return results;
    }

    /**
        @notice Use case: when the called functions don't rely on msg.sender
     */
    function multiCall(Call[] calldata calls) external returns (bytes[] memory results) {
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            results[i] = Address.functionCall(calls[i].target, calls[i].callData);
        }
        return results;
    }
}
