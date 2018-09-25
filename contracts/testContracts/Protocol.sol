pragma solidity ^0.4.25;

import "electusprotocol/contracts/ERC1261MetaData.sol";


contract Protocol is ERC1261MetaData {
    constructor(bytes32 _orgName, bytes32 _orgSymbol) public ERC1261MetaData(_orgName, _orgSymbol) {
    }
}