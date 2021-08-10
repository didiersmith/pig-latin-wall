//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";


contract Wall {
  string message;

  event MsgUpdated(string message);
  
  constructor(string memory _message) {
    console.log("Created Wall with initial message", _message);
    message = _message;
    emit MsgUpdated(message);
  }

  function getMessage() public view returns (string memory) {
    return message;
  }

  function setMessage(string memory _message) public {
    console.log("Changing message from '%s' to '%s'", message, _message);
    message = _message;
    emit MsgUpdated(message);
  }
}
