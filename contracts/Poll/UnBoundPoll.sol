pragma solidity ^0.4.25;

import "electusvoting/contracts/poll/TokenProportionalCapped.sol";
import "../Interfaces/IDaicoToken.sol";


contract UnBoundPoll is TokenProportionalCapped {

    constructor(address[] _protocolAddresses, bytes32[] _proposalNames, address _tokenAddress, uint _capPercent,
    bytes32 _voterBaseLogic, bytes32 _pollName, bytes32 _pollType, uint _startTime, uint _duration) 
        public TokenProportionalCapped(_protocolAddresses, _proposalNames, _tokenAddress, _capPercent,
        _voterBaseLogic, _pollName, _pollType, _startTime, _duration) {
        }

    function canVote(address _to) public view returns (bool) {
        //this is vault address and not 1261 of treasury
        IERC1261 contract1 = IERC1261(protocolAddresses[0]);
        return (contract1.isCurrentMember(_to));
    }

    function getVoterBaseDenominator() public view returns (uint) {
        IDaicoToken daicoToken = IDaicoToken(address(token));
        if (proposals.length <= 1) {
            return daicoToken.getTokensUnderGovernance();
        }
        uint proposalWeight = 0;
        for (uint8 index = 0; index < proposals.length; index++) {
            proposalWeight += proposals[index].voteWeight;
        }
        return proposalWeight;
    }
}