pragma solidity ^0.4.25;

import "electusvoting/contracts/poll/TokenProportionalCappedBound.sol";


contract BoundPoll is TokenProportionalCappedBound {
    
    constructor(address[] _protocolAddresses, bytes32[] _proposalNames, address _tokenAddress, uint _capPercent, 
    bytes32 _voterBaseLogic, bytes32 _pollName, bytes32 _pollType, uint _startTime, uint _duration) 
        public TokenProportionalCappedBound(_protocolAddresses, _proposalNames, _tokenAddress, _capPercent,
        _voterBaseLogic, _pollName, _pollType, _startTime, _duration) {   
        }

    function canVote(address _to) public view returns (bool) {
        //this is vault address and not 1261 of treasury
        IERC1261 contract1 = IERC1261(protocolAddresses[0]);
        return contract1.isCurrentMember(_to);
    }
}