// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BlockMail {
    event Message(
        address indexed from,
        address indexed to,
        string cid,
        uint256 timestamp
    );

    function sendMessage(address to, string calldata cid) external {
        emit Message(msg.sender, to, cid, block.timestamp);
    }
}
