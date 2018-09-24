pragma solidity ^0.4.25;


interface ICrowdSaleTreasury {
    /**
    * @dev Function accepts user`s contributed ether and logs contribution
    * @param contributor Contributor wallet address.
    */
    function processContribution(address contributor) external payable;
    
    /**
    * @dev Function is called if crowdsale failed to reach soft cap
    */
    function enableCrowdsaleRefund() external;

    function onCrowdSaleR1End() external;

    function onR1Start() external;
}
