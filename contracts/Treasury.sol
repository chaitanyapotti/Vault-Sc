pragma solidity ^0.4.25;

import "./Token/ManagedToken.sol";
import "./Interfaces/ICrowdSaleTreasury.sol";
import "./Interfaces/ICrowdSale.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Treasury is ICrowdSaleTreasury, Ownable {
    enum TreasuryState {
        CrowdSale,
        CrowdSaleRefund,
        Governance,
        Killed
    }

    uint public constant INITIAL_TAP = 74421773; //wei/sec corresponds to approx 500 ether/month
    uint public currentTap; //wei/sec
    TreasuryState public state;
    ManagedToken public erc20Token;
    address public crowdSaleAddress;
    uint public firstWithdrawAmount;
    address public teamAddress;
    uint public initalFundRelease;
    address public lockedTokenAddress;
    mapping(address => uint) public contributions;
    uint public lastTapIncrementedAt;

    event RefundContributor(address tokenHolder, uint256 amountWei);
    event RefundHolder(address tokenHolder, uint256 amountWei, uint256 tokenAmount);
    
    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, 
        address _lockedTokenAddress) public {
        erc20Token = ManagedToken(_erc20Token);        
        teamAddress = _teamAddress;
        initalFundRelease = _initalFundRelease;
        lockedTokenAddress = _lockedTokenAddress;
    }

    modifier onlyCrowdSale() {
        require(msg.sender == crowdSaleAddress);
        _;
    }

    function setCrowdSaleAddress(address _crowdSaleAddress) external onlyOwner {
        require(crowdSaleAddress == address(0));
        crowdSaleAddress = _crowdSaleAddress;
    }

    function onR1Start() external onlyCrowdSale {
        state = TreasuryState.CrowdSale;
    }

    function onCrowdSaleR1End() external onlyCrowdSale {
        state = TreasuryState.Governance;
        firstWithdrawAmount = initalFundRelease;
        //lastWithdrawTime = now;
        lastTapIncrementedAt = now;
        currentTap = INITIAL_TAP;
    }    

    function enableCrowdsaleRefund() external onlyCrowdSale {
        require(state == TreasuryState.CrowdSale);
        state = TreasuryState.CrowdSaleRefund;
    }

    function refundCrowdsaleContributor() external {
        require(state == TreasuryState.CrowdSaleRefund, "Can't refund now");
        require(contributions[msg.sender] > 0, "Hasn't contributed");
        uint256 refundAmount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        //This contract address needs to be authorized to be able to burn
        erc20Token.burnFrom(msg.sender, erc20Token.balanceOf(msg.sender)); //Need to check here
        msg.sender.transfer(refundAmount);
        emit RefundContributor(msg.sender, refundAmount);
    }

    function forceRefundCrowdsaleContributor(address _contributor) external onlyOwner {
        require(state == TreasuryState.CrowdSaleRefund);
        require(contributions[_contributor] > 0, "Hasn't contributed");
        uint256 refundAmount = contributions[_contributor];
        contributions[_contributor] = 0;
        //This contract address needs to be authorized to be able to burn
        erc20Token.burnFrom(_contributor, erc20Token.balanceOf(_contributor)); //Need to check here
        _contributor.transfer(refundAmount);
        emit RefundContributor(_contributor, refundAmount);
    }

    function processContribution(address contributor) external payable {
        require(state == TreasuryState.CrowdSale || state == TreasuryState.Governance);
        uint totalContribution = SafeMath.add(contributions[contributor], msg.value);
        contributions[contributor] = totalContribution;
    }

    function refundTokenHolder() public {
        require(state == TreasuryState.Killed);

        uint tokenBalance = erc20Token.balanceOf(msg.sender);
        require(tokenBalance > 0);
        uint refundAmount = SafeMath.div(SafeMath.mul(tokenBalance, address(this).balance), erc20Token.totalSupply());
        require(refundAmount > 0);

        erc20Token.burnFrom(msg.sender, tokenBalance);
        msg.sender.transfer(refundAmount);

        emit RefundHolder(msg.sender, refundAmount, tokenBalance);
    }

}