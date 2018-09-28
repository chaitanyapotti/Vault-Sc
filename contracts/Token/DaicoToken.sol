pragma solidity ^0.4.25;

import "electusvoting/contracts/Token/FreezableToken.sol";
import "electusprotocol/contracts/Protocol/IElectusProtocol.sol";
import "../Interfaces/IPollAddresses.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract DaicoToken is FreezableToken, Ownable {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public tokensUnderGovernance;
    address public crowdSaleAddress;
    IERC1261 public vaultMembership;
    IPollAddresses public pollMember;

    constructor(string _name, string _symbol, address _vaultAddress, uint _totalMintableSupply) public {
        name = _name;
        symbol = _symbol;
        totalMintableSupply = _totalMintableSupply;
        vaultMembership = IERC1261(_vaultAddress);
    }

    modifier onlyTreasury {
        require(msg.sender == address(pollMember), "Only treasury can burn");
        _;
    }

    modifier onlyCrowdSale() {
        require(msg.sender == crowdSaleAddress, "Only crowdsale can mint");
        _;
    }

    modifier isPollAddress() {
        require(pollMember.isPollAddress(msg.sender), "Not a poll, cannot freeze/ unfreeze");
        _;
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(address(pollMember) == address(0));
        pollMember = IPollAddresses(_treasuryAddress);
    }

    function setCrowdSaleAddress(address _crowdSaleAddress) external onlyOwner {
        require(crowdSaleAddress == address(0));
        crowdSaleAddress = _crowdSaleAddress;
    }

    function burn(uint256 _value) external {
        updateGovernanceTokens(msg.sender, address(0), _value);
        super._burn(msg.sender, _value);
    }

    function burnFrom(address _from, uint256 _value) external onlyTreasury {
        updateGovernanceTokens(_from, address(0), _value);
        super._burn(_from, _value);
    }

    function getTokensUnderGovernance() external view returns (uint) {
        return tokensUnderGovernance;
    }

    function freezeAccount(address _target) public isPollAddress {
        super.freezeAccount(_target);
    }

    function unFreezeAccount(address _target) public isPollAddress {
        super.unFreezeAccount(_target);
    }

    function mint(address _to, uint256 _amount, bool _hasGovernance) public onlyCrowdSale returns (bool) {
        if (_hasGovernance) tokensUnderGovernance += _amount;
        return super.mint(_to, _amount);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        updateGovernanceTokens(msg.sender, _to, _value);        
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        updateGovernanceTokens(_from, _to, _value);
        return super.transferFrom(_from, _to, _value);
    }

    function finishMinting() public onlyCrowdSale returns (bool) {
        return super.finishMinting();
    }

    function updateGovernanceTokens(address _from, address _to, uint _value) internal {
        if (_to == address(0)) {
            tokensUnderGovernance += vaultMembership.isCurrentMember(_from) ? -_value : _value;
        } else if (vaultMembership.isCurrentMember(_from) && !vaultMembership.isCurrentMember(_to)) {
            tokensUnderGovernance -= _value;
        } else if (!vaultMembership.isCurrentMember(_from) && vaultMembership.isCurrentMember(_to)) {
            tokensUnderGovernance += _value;
        }
    }
}