pragma solidity ^0.4.25;


interface IPollAddresses {
    function isPollAddress(address _address) external view returns (bool);
}