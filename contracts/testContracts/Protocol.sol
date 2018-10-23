pragma solidity ^0.4.25;

import "electusprotocol/contracts/ERC1261MetaData.sol";


contract Protocol is ERC1261MetaData {
    IERC1261 public vault;

    constructor(bytes32 _orgName, bytes32 _orgSymbol, address vaultAddress) 
        public ERC1261MetaData(_orgName, _orgSymbol) {
            vault = IERC1261(vaultAddress);
        }

    function requestMembership(uint[] _attributeIndexes) external payable {
        //Do some checks before assigning membership
        require(!isCurrentMember(msg.sender), "Already a member");
        emit RequestedMembership(msg.sender);
        bytes32 attributeValue = vault.getAttributeByName(msg.sender, 
        0x436f756e74727900000000000000000000000000000000000000000000000000);
        require(vault.isCurrentMember(msg.sender) && attributeValue
        != 0x5553410000000000000000000000000000000000000000000000000000000000 && attributeValue
        != 0x4368696e61000000000000000000000000000000000000000000000000000000, "Should not be from USA or China");
        _assign(msg.sender, _attributeIndexes);
        // address admin = owner();
        // admin.transfer(msg.value);
    }
}