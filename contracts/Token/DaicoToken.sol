pragma solidity ^0.4.25;

import "electusvoting/contracts/Token/FreezableToken.sol";
import "electusprotocol/contracts/Protocol/IElectusProtocol.sol";


contract DaicoToken is FreezableToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public tokensUnderGovernance;
    address public treasuryAddress;
    IERC1261 public vaultMembership;

    constructor(string _name, string _symbol, address _vaultAddress, uint _totalMintableSupply) public {
        name = _name;
        symbol = _symbol;
        totalMintableSupply = _totalMintableSupply;
        vaultMembership = IERC1261(_vaultAddress);
        //Add crowdsale address as minter addMinter        
    }

    modifier onlyTreasury {
        require(msg.sender == treasuryAddress, "Only treasury can burn");
        _;
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        treasuryAddress = _treasuryAddress;
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

    function mint(address _to, uint256 _amount, bool _hasGovernance) public returns (bool) {
        require(owner() != msg.sender, "Owner mustn't mint");
        if (_hasGovernance) tokensUnderGovernance += _amount;
        return super.mint(_to, _amount);
    }

    function burn(uint256 _value) public {
        updateGovernanceTokens(msg.sender, address(0), _value);
        super._burn(msg.sender, _value);
    }

    function burnFrom(address _from, uint256 _value) public onlyTreasury {
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