pragma solidity ^0.4.25;

import "electusprotocol/contracts/ERC1261MetaData.sol";


contract Vault is ERC1261MetaData {
    struct PendingRequest {
        bool isPending;
        uint[] attributes;
    }

    event ApprovedMembership(address indexed _user);
    event RequestedMembership(address indexed _user);

    mapping(address => PendingRequest) public pendingRequests;

    uint public fee;

    constructor(bytes32 _orgName, bytes32 _orgSymbol, uint _fee) public 
        ERC1261MetaData(_orgName, _orgSymbol) {
        fee = _fee;
    }

    function modifyFee(uint _newFee) external onlyOwner {
        fee = _newFee;
    }

    function requestMembership(uint[] _attributeIndexes) external payable {
        require(!isCurrentMember(msg.sender), "Already a member");
        //Do some checks before assigning membership
        require(msg.value > fee, "Not enough ether sent for membership");
        PendingRequest storage request = pendingRequests[msg.sender];
        request.isPending = true;
        request.attributes = _attributeIndexes;
        address admin = owner();
        emit RequestedMembership(msg.sender);
        admin.transfer(msg.value);
    }

    function approveRequest(address _user) external onlyOwner {
        PendingRequest storage request = pendingRequests[_user];
        require(request.isPending, "Hasn't sent ether yet");
        super._assign(_user, request.attributes);
        emit ApprovedMembership(_user);
    }

    function discardRequest(address _user) external onlyOwner {
        PendingRequest storage request = pendingRequests[_user];
        require(request.isPending, "Hasn't sent ether yet");
        //what's preventing us from collecting ether from users and discarding all requests
        request.isPending = false;
        delete request.attributes;
    }
}