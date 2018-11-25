pragma solidity ^0.4.25;

import "electusvoting/contracts/poll/TokenProportionalCapped.sol";
import "../Interfaces/IDaicoToken.sol";


contract UnBoundPoll is TokenProportionalCapped {

    bool public hasPollEnded;
    address public pollFactoryAddress;

    constructor(address[] _protocolAddresses, bytes32[] _proposalNames, address _tokenAddress, uint _capPercent,
    bytes32 _voterBaseLogic, bytes32 _pollName, bytes32 _pollType, uint _startTime, uint _duration, 
    address _pollFactoryAddress) public TokenProportionalCapped(_protocolAddresses, _proposalNames, _tokenAddress, 
    _capPercent, _voterBaseLogic, _pollName, _pollType, _startTime, _duration) {
        pollFactoryAddress = _pollFactoryAddress;
    }

    function endPoll() external {
        require(msg.sender == pollFactoryAddress, "Not enough rights");
        hasPollEnded = true;
    }

    function vote(uint8 _proposal) external isPollStarted {
        require(!hasPollEnded, "Poll has ended");
        Voter storage sender = voters[msg.sender];
        uint voteWeight = calculateVoteWeight(msg.sender);
        //vote weight is multiplied by 100 to account for decimals
        
        if (canVote(msg.sender) && !sender.voted && _proposal < proposals.length) {
            sender.voted = true;
            sender.vote = _proposal;
            sender.weight = voteWeight;
            proposals[_proposal].voteWeight += sender.weight;
            proposals[_proposal].voteCount += 1;
            emit CastVote(msg.sender, _proposal, sender.weight);
            //Need to check whether we can freeze or not.!
            token.freezeAccount(msg.sender);
        } else {
            emit TriedToVote(msg.sender, _proposal, voteWeight);
        }
    }

    function revokeVote() external isValidVoter {
        if (!hasPollEnded) {
            Voter storage sender = voters[msg.sender];
            require(sender.voted, "Hasn't yet voted.");
            uint8 votedProposal = sender.vote;
            uint voteWeight = sender.weight;
            sender.voted = false;
            proposals[sender.vote].voteWeight -= sender.weight;
            proposals[sender.vote].voteCount -= 1;
            sender.vote = 0;
            sender.weight = 0;
            emit RevokedVote(msg.sender, votedProposal, voteWeight);
        }
        token.unFreezeAccount(msg.sender);
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