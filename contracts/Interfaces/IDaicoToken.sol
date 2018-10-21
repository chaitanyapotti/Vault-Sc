pragma solidity ^0.4.25;


interface IDaicoToken {
    function mint(address _to, uint256 _amount, bool _hasGovernance) external returns (bool);

    function finishMinting() external returns (bool);

    function burnFrom(address _from, uint256 _value) external;

    function balanceOf(address owner) external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function getTokensUnderGovernance() external view returns (uint);

    function getTotalMintableSupply() external view returns (uint);
}