pragma solidity ^0.4.25;

import "./Poll/BoundPoll.sol";
import "./Poll/UnBoundPoll.sol";


contract PollDeployer {
    function deployBoundPoll(address _protocolAddress, string _proposalName, address _tokenAddress, 
    uint _capPercent, string _voterBaseLogic, string _pollName, string _pollType, uint _startTime, 
    uint _duration) public returns (address boundPoll) {
        address[] memory vaultMembershipAddress = new address[](1);
        vaultMembershipAddress[0] = _protocolAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32(_proposalName);
        boundPoll = new BoundPoll(vaultMembershipAddress, proposal, _tokenAddress, _capPercent, 
                stringToBytes32(_voterBaseLogic), 
                stringToBytes32(_pollName), 
                stringToBytes32(_pollType),
                _startTime, _duration);
    }

    function deployUnBoundPoll(address _protocolAddress, string _proposalName, address _tokenAddress, uint _capPercent,
    string _voterBaseLogic, string _pollName, string _pollType, uint _startTime, uint _duration, 
    address _pollFactoryAddress) public returns (address unBoundPoll) {
        address[] memory vaultMembershipAddress = new address[](1);
        vaultMembershipAddress[0] = _protocolAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32(_proposalName);
        unBoundPoll = new UnBoundPoll(vaultMembershipAddress, proposal, _tokenAddress, _capPercent, 
                stringToBytes32(_voterBaseLogic), 
                stringToBytes32(_pollName), 
                stringToBytes32(_pollType),
                _startTime, _duration, _pollFactoryAddress);
    }

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        // solhint-disable-next-line
        assembly {
            result := mload(add(source, 32))
        }
    }
}