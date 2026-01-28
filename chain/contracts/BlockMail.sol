// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BlockMail {
    event SendEmail(
        address indexed from,
        address indexed to,
        bytes32 indexed digest,
        string cid,
        uint256 timestamp
    );

    function sendEmail(address to, bytes32 digest, string calldata cid) external {
        emit SendEmail(msg.sender, to, digest, cid, block.timestamp);
    }
}
