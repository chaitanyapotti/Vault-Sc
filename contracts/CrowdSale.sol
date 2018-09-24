pragma solidity ^0.4.25;

import "./Token/LockedTokens.sol";
import "./Token/ManagedToken.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol"; //need to check if necessary
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Interfaces/ICrowdSale.sol";
import "./Interfaces/ICrowdSaleTreasury.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol"; //need to check if necessary


contract CrowdSale is Pausable, ICrowdSale, Ownable {
    enum Round {
        Round1,
        Round2,
        Round3,
        CrowdSaleRefund
    }

    struct Contribution {
        Round contributionRound;
        uint amount;
    }

    struct RoundData {
        uint tokenCount;
        uint tokenPrice; //price is in tokens/wei
        uint totalTokensSent;
        uint endTime;
    }

    RoundData[3] public roundDetails;
    ManagedToken public erc20Token;
    ICrowdSaleTreasury public treasury;
    LockedTokens public lockedTokens;
    IERC1261 public vaultMembership;
    IERC1261 public membership;


    uint public etherMinContrib;
    uint public etherMaxContrib;
    uint public currentRoundEndTime;
    mapping(address => Contribution[3]) public userContributonDetails;
    Round public currentRound;
    //bool public isRoundRunning;

    event LogContribution(address contributor, uint etherAmount, uint tokenAmount);

    modifier checkContribution() {
        require(isValidContribution() && canContribute(msg.sender));
        _;
    }

    constructor (uint _etherMinContrib, uint _etherMaxContrib, uint _r1EndTime, 
        uint[3] _roundTokenCounts, uint[3] _roundTokenPrices, uint _totalTokenCount,
        address _lockedTokensAddress, address _treasuryAddress, address _membershipAddress,
        address _erc20TokenAddress, address _vaultMembershipAddress, address _foundationTokenWallet) public {

        lockedTokens = LockedTokens(_lockedTokensAddress);
        erc20Token = ManagedToken(_erc20TokenAddress);
        vaultMembership = IERC1261(_vaultMembershipAddress);
        treasury = ICrowdSaleTreasury(_treasuryAddress);
        membership = IERC1261(_membershipAddress);

        uint foundationTokens = _totalTokenCount - _roundTokenCounts[0] - _roundTokenCounts[1] - _roundTokenCounts[2];
        erc20Token.mint(_lockedTokensAddress, foundationTokens, false);
        lockedTokens.addTokens(_foundationTokenWallet, foundationTokens, now + 365 days);

        etherMinContrib = _etherMinContrib;
        etherMaxContrib = _etherMaxContrib;

        roundDetails[0] = RoundData({
            tokenCount: _roundTokenCounts[0], tokenPrice: _roundTokenPrices[0], endTime: _r1EndTime, totalTokensSent: 0
        });
        roundDetails[1] = RoundData({
            tokenCount: _roundTokenCounts[1], tokenPrice: _roundTokenPrices[1], endTime: 0, totalTokensSent: 0
        });
        roundDetails[2] = RoundData({
            tokenCount: _roundTokenCounts[2], tokenPrice: _roundTokenPrices[2], endTime: 0, totalTokensSent: 0
        });

        pause();
    }

    /*checkFlag for later rounds and time for round 1*/
    function () public payable whenNotPaused {
        processContribution(msg.sender, msg.value);
    }

    //onlyOwner maybe
    function finalizeR1Crowdsale() public {
        RoundData storage roundInfo = roundDetails[0];
        if (roundInfo.totalTokensSent >= roundInfo.tokenCount) {
            //firstRoundEndTime = now; //check validity
            treasury.onCrowdSaleR1End();
        } else if (now >= currentRoundEndTime && roundInfo.totalTokensSent < roundInfo.tokenCount) {
            pause();
            currentRound = Round.CrowdSaleRefund;
            // Enable fund`s crowdsale refund if soft cap is not reached
            treasury.enableCrowdsaleRefund();
            //token.finishIssuance();
        }
    }

    function startNewRound() public onlyOwner whenPaused {
        // when first round is complete--pause auto 
        require(currentRound != Round.CrowdSaleRefund, "Crowdsale is killed already");
        require(currentRound != Round.Round3, "Already in round 3");
        require(now - currentRoundEndTime > 24 hours, "Must wait 24 hrs to start another round");
        if (currentRoundEndTime != 0) {  
            currentRound = Round(uint(currentRound) + 1);
        } else {
            require(now < roundDetails[0].endTime, "First round has elapsed");
            currentRoundEndTime = roundDetails[0].endTime;
            treasury.onR1Start();
        }
        unpause();
    }

    function canContribute(address _contributor) public view returns (bool) {
        return vaultMembership.isCurrentMember(_contributor) && membership.isCurrentMember(_contributor);
    }

    function isValidContribution() internal view returns (bool) {
        uint round = uint(currentRound);        
        Contribution storage userContrib = userContributonDetails[msg.sender][round];
        uint256 currentUserContribution = SafeMath.add(msg.value, userContrib.amount);
        
        if (msg.value >= etherMinContrib && currentUserContribution <= etherMaxContrib) {
            return true;
        }
        return false;
    }

    function processContribution(address _contributor, uint256 _amount) internal checkContribution {
        uint round = uint(currentRound);
        if (round == 0) require(now <= currentRoundEndTime, "First round has passed");
        RoundData storage roundInfo = roundDetails[round];

        uint tokensToGiveUser = SafeMath.mul(_amount, roundInfo.tokenPrice);
        uint tempTotalTokens = SafeMath.add(tokensToGiveUser, roundInfo.totalTokensSent);
        uint weiSpent = 0;
        uint totalTokensToSend = 0;
        if (tempTotalTokens <= roundInfo.tokenCount) {
            weiSpent = _amount;
            totalTokensToSend = tokensToGiveUser;
            roundInfo.totalTokensSent = tempTotalTokens;
            //send user the tokens
        } else {
            uint leftTokens = SafeMath.sub(roundInfo.tokenCount, roundInfo.totalTokensSent);
            weiSpent = SafeMath.div(leftTokens, roundInfo.tokenPrice);
            roundInfo.totalTokensSent = roundInfo.tokenCount;
            totalTokensToSend = leftTokens;
            //check for round 3 - finish Minting
            if (round != 2) {
                uint weiLeft = SafeMath.sub(_amount, weiSpent);
                RoundData storage nextRoundInfo = roundDetails[round + 1];
                uint rightTokens = SafeMath.mul(weiLeft, nextRoundInfo.tokenPrice);
                nextRoundInfo.totalTokensSent = rightTokens;
                Contribution storage userContrib = userContributonDetails[_contributor][round + 1];
                userContrib.amount = SafeMath.add(userContrib.amount, weiLeft);
                totalTokensToSend = SafeMath.add(totalTokensToSend, rightTokens);
            }
            currentRoundEndTime = now;
            pause();
        }
        Contribution storage userContribGlobal = userContributonDetails[_contributor][round];
        userContribGlobal.amount = SafeMath.add(userContribGlobal.amount, weiSpent);
        
        processPayment(_contributor, _amount, totalTokensToSend);
        if (round == 2 && currentRoundEndTime == now) erc20Token.finishMinting();
    }

    function processPayment(address contributor, uint etherAmount, uint256 tokenAmount) internal {
        erc20Token.mint(contributor, tokenAmount, true);
        treasury.processContribution.value(etherAmount)(contributor);
        emit LogContribution(contributor, etherAmount, tokenAmount);
    }
}
