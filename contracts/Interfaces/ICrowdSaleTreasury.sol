pragma solidity ^0.4.25;


interface ICrowdSaleTreasury {
    function processContribution() external payable;
    
    function enableCrowdsaleRefund() external;

    function onCrowdSaleR1End() external;

    function onR1Start() external;

    function isKillPollDeployed() external view returns (bool);

    function getKillPollStartDate() external view returns (uint);
}
