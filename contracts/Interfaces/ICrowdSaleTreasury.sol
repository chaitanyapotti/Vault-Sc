pragma solidity ^0.4.25;


interface ICrowdSaleTreasury {
    function processContribution() external payable;
    
    function enableCrowdsaleRefund() external;

    function onCrowdSaleR1End() external;

    function onR1Start() external;
}
