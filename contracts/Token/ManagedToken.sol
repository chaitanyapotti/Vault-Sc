pragma solidity ^0.4.25;

import "electusvoting/contracts/Token/FreezableToken.sol";
import "electusprotocol/contracts/Protocol/IElectusProtocol.sol";
import "openzeppelin-solidity/contracts/access/roles/MinterRole.sol";


contract ManagedToken is FreezableToken, MinterRole {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public tokensUnderGovernance;
    IERC1261 public vaultMembership;
    bool private _mintingFinished = false;

    event MintingFinished();

    constructor(string _name, string _symbol, address _vaultAddress) public {
        name = _name;
        symbol = _symbol;
        vaultMembership = IERC1261(_vaultAddress);
        //Add crowdsale address as minter addMinter        
    }

    modifier onlyBeforeMintingFinished() {
        require(!_mintingFinished);
        _;
    }

    function getTokensUnderGovernance() public view returns (uint) {
        return tokensUnderGovernance;
    }

    function setCrowdSaleAddress(address _crowdSaleAddress) public onlyMinter {
        addMinter(_crowdSaleAddress);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        updateGovernanceTokens(msg.sender, _to, _value);        
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        updateGovernanceTokens(_from, _to, _value);
        return super.transferFrom(_from, _to, _value);
    }

    function mintingFinished() public view returns(bool) {
        return _mintingFinished;
    }

    function mint(address _to, uint256 _amount, bool _hasGovernance) public onlyMinter 
        onlyBeforeMintingFinished returns (bool) {
        if (_hasGovernance) tokensUnderGovernance += _amount;
        _mint(_to, _amount);
        return true;
    }

    function finishMinting() public onlyMinter onlyBeforeMintingFinished returns (bool) {
        _mintingFinished = true;
        emit MintingFinished();
        return true;
    }

    function burn(uint256 _value) public {
        updateGovernanceTokens(msg.sender, address(0), _value);
        super._burn(msg.sender, _value);
    }

    function burnFrom(address _from, uint256 _value) public onlyAuthorized {
        updateGovernanceTokens(_from, address(0), _value);
        super._burn(_from, _value);
    }

    function updateGovernanceTokens(address _from, address _to, uint _value) internal {
        if (vaultMembership.isCurrentMember(_from) && !vaultMembership.isCurrentMember(_to)) {
            tokensUnderGovernance -= _value;
        } else if (!vaultMembership.isCurrentMember(_from) && vaultMembership.isCurrentMember(_to)) {
            tokensUnderGovernance += _value;
        }
    }

}