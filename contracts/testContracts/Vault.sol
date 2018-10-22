pragma solidity ^0.4.25;

import "electusprotocol/contracts/ERC1261MetaData.sol";


contract Vault is ERC1261MetaData {
    uint public fee;

    constructor(bytes32 _orgName, bytes32 _orgSymbol, uint _fee) public 
        ERC1261MetaData(_orgName, _orgSymbol) {
        fee = _fee;
    }

    function modifyFee(uint _newFee) external onlyOwner {
        fee = _newFee;
    }

    function requestMembership(uint[] _attributeIndexes) external payable {
        //Do some checks before assigning membership
        require(msg.value > fee, "Not enough ether sent for membership");
        require(!isCurrentMember(msg.sender), "Already a member");
        PendingRequest storage request = pendingRequests[msg.sender];
        request.isPending = true;
        request.attributes = _attributeIndexes;
        emit RequestedMembership(msg.sender);
        address admin = owner();
        admin.transfer(msg.value);
    }
}