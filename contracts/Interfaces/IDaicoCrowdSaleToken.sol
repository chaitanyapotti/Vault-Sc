pragma solidity ^0.4.25;


interface IDaicoCrowdSaleToken {
    function mint(address _to, uint256 _amount, bool _hasGovernance) external returns (bool);

    function getTotalMintableSupply() external view returns (uint);

    function finishMinting() external returns (bool);
}