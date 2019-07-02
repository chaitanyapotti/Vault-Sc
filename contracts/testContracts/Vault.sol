pragma solidity ^0.4.25;

import "membershipverificationtoken/contracts/ERC1261MetaData.sol";

contract Vault is ERC1261MetaData {
    uint public fee;
    uint public issuerFee;

    constructor(bytes32 _orgName, bytes32 _orgSymbol, uint _fee, uint _issuerFee) public ERC1261MetaData(_orgName, _orgSymbol) {
        fee = _fee;
        issuerFee = _issuerFee;
    }

    function modifyFee(uint _newFee) external onlyOwner {
        fee = _newFee;
    }

    function modifyIssuerFee(uint _newFee) external onlyOwner {
        issuerFee = _newFee;
    }

    function requestMembership(uint[] _attributeIndexes) external payable {
        require(!isCurrentMember(msg.sender), "Already a member");
        if (_attributeIndexes[1] == 0) require(msg.value >= issuerFee, "Not enough fee for issuer");
        else require(msg.value >= fee, "Not enough ether sent for membership");

        PendingRequest storage request = pendingRequests[msg.sender];
        request.isPending = true;
        request.attributes = _attributeIndexes;
        emit RequestedMembership(msg.sender);
        address admin = owner();
        admin.transfer(msg.value);
    }
}
