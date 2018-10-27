pragma solidity ^0.4.25;

import "./Interfaces/IDaicoToken.sol";
import "./Interfaces/ICrowdSaleTreasury.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Treasury is ICrowdSaleTreasury, Ownable {
    enum TreasuryState {
        CrowdSale,
        CrowdSaleRefund,
        Governance,
        Killed
    }
    
    uint public constant VERSION = 1;
    bytes32[2] public labelKill;
    bytes32[2] public labelTapIncrement;
    bytes32[4] public labelXfrWithdraw;

    uint public initialTap; //= 14844355; //wei/sec corresponds to approx 100 ether/month
    uint public currentTap; //wei/sec
    TreasuryState public state;
    IDaicoToken public erc20Token;
    address public crowdSaleAddress;
    address public teamAddress;
    uint public initalFundRelease;
    address public lockedTokenAddress;
    uint public pivotTime;
    uint public totalEtherRaised;
    uint public tapIncrementFactor; // = 150;

    event RefundSent(address tokenHolder, uint256 amountWei, uint256 tokenAmount);
    event DaicoRefunded();
    
    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, 
        address _lockedTokenAddress, uint _initialTap, uint _tapIncrementFactor) public {
        erc20Token = IDaicoToken(_erc20Token);
        teamAddress = _teamAddress;
        initalFundRelease = _initalFundRelease;
        lockedTokenAddress = _lockedTokenAddress;
        initialTap = _initialTap;
        tapIncrementFactor = _tapIncrementFactor;
        labelKill[0] = 0x416c6c6f77204b696c6c00000000000000000000000000000000000000000000;//Allow kill
        labelKill[1] = 0x446f206e6f74204b696c6c000000000000000000000000000000000000000000;//Do not Kill
        labelTapIncrement[0] = 0x416c6c6f772054617020496e6372656d656e7400000000000000000000000000;//Allow Tap Increment
        labelTapIncrement[1] = 0x446f206e6f7420496e6372656d656e7420546170000000000000000000000000;//Donot Increment Tap
        labelXfrWithdraw[0] = 0x5769746864726177204e6f6e6500000000000000000000000000000000000000;//Withdraw None
        labelXfrWithdraw[1] = 0x5769746864726177204669727374207866720000000000000000000000000000;//Withdraw First Xfr
        labelXfrWithdraw[2] = 0x5769746864726177205365636f6e642058667200000000000000000000000000;//Withdraw Second Xfr
        labelXfrWithdraw[3] = 0x576974686472617720426f746820586672000000000000000000000000000000;//Withdraw Both Xfr
    }

    modifier onlyCrowdSale() {
        require(msg.sender == crowdSaleAddress, "Not crowdsale address");
        _;
    }

    modifier onlyDuringCrowdSale() {
        require(state == TreasuryState.CrowdSale, "Not crowdsale phase");
        _;
    }

    modifier onlyDuringCrowdSaleRefund() {
        require(state == TreasuryState.CrowdSaleRefund, "Not crowdsale refund phase");
        _;
    }

    modifier onlyDuringGovernance() {
        require(state == TreasuryState.Governance, "Not Governance phase");
        _;
    }

    modifier onlyWhenKilled() {
        require(state == TreasuryState.Killed, "Not yet killed phase");
        _;
    }

    function setCrowdSaleAddress(address _crowdSaleAddress) external onlyOwner {
        require(crowdSaleAddress == address(0));
        crowdSaleAddress = _crowdSaleAddress;
    }

    function onR1Start() external onlyCrowdSale {
        state = TreasuryState.CrowdSale;
    }

    function onCrowdSaleR1End() external;

    function enableCrowdsaleRefund() external onlyCrowdSale onlyDuringCrowdSale {
        state = TreasuryState.CrowdSaleRefund;
        burnLockedTokens();
        emit DaicoRefunded();
    }

    function refundBySoftcapFail() external onlyDuringCrowdSaleRefund {
        //This contract address needs to be authorized to be able to burn
        refundContributor(msg.sender);
    }

    function forceRefundBySoftcapFail(address _contributor) external onlyOwner onlyDuringCrowdSaleRefund {
        refundContributor(_contributor);
        //This contract address needs to be authorized to be able to burn
    }

    function processContribution() external payable {
        require(state == TreasuryState.CrowdSale || state == TreasuryState.Governance);
        totalEtherRaised = SafeMath.add(totalEtherRaised, msg.value);
    }

    function isKillPollDeployed() external view returns (bool);

    function getKillPollStartDate() external view returns (uint);

    function refundByKill() public onlyWhenKilled {
        refundContributor(msg.sender);
    }

    function burnLockedTokens() internal onlyDuringCrowdSaleRefund {
        erc20Token.burnFrom(lockedTokenAddress, erc20Token.balanceOf(lockedTokenAddress));
    }

    function refundContributor(address _contributor) internal {
        uint tokenBalance = erc20Token.balanceOf(_contributor);
        require(tokenBalance > 0, "Zero token balance");
        uint refundAmount = SafeMath.div(SafeMath.mul(tokenBalance, address(this).balance), erc20Token.totalSupply());
        require(refundAmount > 0, "No refund amount available");
        erc20Token.burnFrom(_contributor, tokenBalance);
        _contributor.transfer(refundAmount);
        emit RefundSent(_contributor, refundAmount, tokenBalance);
    }
}