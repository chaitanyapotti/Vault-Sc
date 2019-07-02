pragma solidity ^0.4.25;

import "membershipverificationtoken/contracts/ERC1261MetaData.sol";

contract Protocol is ERC1261MetaData {
    IERC1261 public vault;

    constructor(bytes32 _orgName, bytes32 _orgSymbol, address vaultAddress) public ERC1261MetaData(_orgName, _orgSymbol) {
        vault = IERC1261(vaultAddress);
    }

    function requestMembership(uint[] _attributeIndexes) external payable {
        //Do some checks before assigning membership
        require(!isCurrentMember(msg.sender), "Already a member");
        require(vault.isCurrentMember(msg.sender), "Must be a vault member");
        emit RequestedMembership(msg.sender);
        uint attributeValue = vault.getAttributeByIndex(msg.sender, 0);
        if (attributeValue != 220 && attributeValue != 43 && attributeValue != 187) {
            _assign(msg.sender, _attributeIndexes);
            emit Assigned(msg.sender, _attributeIndexes);
        } else {
            PendingRequest storage request = pendingRequests[msg.sender];
            request.isPending = true;
            request.attributes = _attributeIndexes;
        }
    }

    function assignTo(address _to, uint[] _attributeIndexes) external onlyOwner {
        require(vault.isCurrentMember(_to), "the _to address must already be a vault member");
        _assign(_to, _attributeIndexes);
        emit Assigned(_to, _attributeIndexes);
    }
}
