pragma solidity ^0.4.25;

interface ILockedTokens {
    function addTokens(address _to, uint _amount, uint _lockEndTime) external;
}
