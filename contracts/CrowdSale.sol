pragma solidity ^0.4.25;

import "./Interfaces/ILockedTokens.sol";
import "./Interfaces/IDaicoToken.sol";
import "membershipverificationtoken/contracts/Protocol/IERC1261.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Interfaces/ICrowdSaleTreasury.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol"; //need to check if necessary


contract CrowdSale is Ownable {
    enum Round {
        Round1,
        Round2,
        Round3,
        R3Ended,
        CrowdSaleRefund
    }

    struct Contribution {
        Round contributionRound;
        uint amount;
    }

    struct RoundData {
        uint tokenCount;
        uint tokenRate; //rate is in tokens/wei
        uint totalTokensSold;
        uint endTime;
        uint startTime;
    }

    uint public constant VERSION = 1;

    RoundData[3] public roundDetails;
    IDaicoToken public erc20Token;
    ICrowdSaleTreasury public treasury;
    ILockedTokens public lockedTokens;
    IERC1261 public vaultMembership;
    IERC1261 public membership;

    bool private paused;
    uint public etherMinContrib;
    uint public etherMaxContrib;
    uint public currentRoundEndTime;
    address[] public foundationTokenWallets; 
    uint[] public foundationAmounts;
    bool internal mintedFoundationTokens;
    mapping(address => Contribution[3]) public userContributonDetails;
    Round public currentRound;

    event LogContribution(address contributor, uint etherAmount, uint tokenAmount);

    constructor (uint _etherMinContrib, uint _etherMaxContrib, uint _r1EndTime, uint _r1StartTime,
        uint[3] _roundTokenCounts, uint[3] _roundtokenRates, address _lockedTokensAddress, 
        address _treasuryAddress, address _membershipAddress, address _erc20TokenAddress, 
        address _vaultMembershipAddress, address[] _foundationTokenWallets, uint[] _foundationAmounts) public {

        lockedTokens = ILockedTokens(_lockedTokensAddress);
        erc20Token = IDaicoToken(_erc20TokenAddress);
        vaultMembership = IERC1261(_vaultMembershipAddress);
        treasury = ICrowdSaleTreasury(_treasuryAddress);
        membership = IERC1261(_membershipAddress);

        assert(_foundationTokenWallets.length == _foundationAmounts.length);

        uint killPollStartDate = treasury.getKillPollStartDate();
        assert(killPollStartDate == _r1EndTime);
        
        foundationTokenWallets = _foundationTokenWallets;
        foundationAmounts = _foundationAmounts;

        etherMinContrib = _etherMinContrib;
        etherMaxContrib = _etherMaxContrib;

        roundDetails[0] = RoundData({
            tokenCount: _roundTokenCounts[0], tokenRate: _roundtokenRates[0], endTime: _r1EndTime, totalTokensSold: 0, 
            startTime: _r1StartTime
        });
        roundDetails[1] = RoundData({
            tokenCount: _roundTokenCounts[1], tokenRate: _roundtokenRates[1], endTime: 0, totalTokensSold: 0, 
            startTime: 0
        });
        roundDetails[2] = RoundData({
            tokenCount: _roundTokenCounts[2], tokenRate: _roundtokenRates[2], endTime: 0, totalTokensSold: 0, 
            startTime: 0
        });
        paused = true;
    }

    modifier checkContribution() {
        require(isValidContribution() && canContribute(msg.sender), "Not a valid contribution");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Crowdsale is paused");
        _;
    }

    function () public payable whenNotPaused {
        processContribution(msg.sender, msg.value);
    }

    function mintFoundationTokens() public {
        require(!mintedFoundationTokens, "Already minted foundation tokens");
        mintedFoundationTokens = true;
        uint foundationTokensTotal = 0;        
        for (uint index = 0; index < foundationTokenWallets.length; index++) {
            foundationTokensTotal = SafeMath.add(foundationTokensTotal, foundationAmounts[index]);
            lockedTokens.addTokens(foundationTokenWallets[index], foundationAmounts[index], now + 365 days);
        }
        RoundData storage round1Info = roundDetails[0];
        RoundData storage round2Info = roundDetails[1];
        RoundData storage round3Info = roundDetails[2];
        uint foundationAssert = erc20Token.getTotalMintableSupply() - round1Info.tokenCount - 
            round2Info.tokenCount - round3Info.tokenCount;
        assert(foundationTokensTotal == foundationAssert);
        erc20Token.mint(address(lockedTokens), foundationTokensTotal, false);
    }

    function finalizeRoundOne() public {
        RoundData storage roundInfo = roundDetails[0];
        if (now >= currentRoundEndTime && roundInfo.totalTokensSold < roundInfo.tokenCount) {
            paused = true;
            currentRound = Round.CrowdSaleRefund;
            treasury.enableCrowdsaleRefund();
        }
    }

    function startNewRound() public onlyOwner {
        require(paused, "Crowdsale must be paused");
        require(currentRound != Round.CrowdSaleRefund, "Crowdsale is killed already");
        require(currentRound != Round.Round3, "Already in round 3");
        require(now - currentRoundEndTime > 24 hours, "Must wait 24 hrs to start another round");
        if (currentRoundEndTime != 0) {
            currentRound = Round(uint(currentRound) + 1);
            RoundData storage roundInfo = roundDetails[uint(currentRound)];
            roundInfo.startTime = now;
        } else {
            require(now > roundDetails[0].startTime, "Can't start yet");
            require(now < roundDetails[0].endTime, "First round has elapsed");
            require(treasury.isKillPollDeployed(), "Kills have not been deployed");
            currentRoundEndTime = roundDetails[0].endTime;
            treasury.onR1Start();
        }
        paused = false;
    }

    function canContribute(address _contributor) public view returns (bool) {
        return vaultMembership.isCurrentMember(_contributor) && membership.isCurrentMember(_contributor);
    }

    function isValidContribution() internal view returns (bool) {
        uint round = uint(currentRound);        
        Contribution storage userContrib = userContributonDetails[msg.sender][round];
        uint256 currentUserContribution = SafeMath.add(msg.value, userContrib.amount);
        RoundData storage roundInfo = roundDetails[round];
        if ((msg.value >= etherMinContrib || SafeMath.add(SafeMath.mul(msg.value, roundInfo.tokenRate), 
        roundInfo.totalTokensSold) >= roundInfo.tokenCount) && (currentRound != Round.Round1 || 
        (currentRound == Round.Round1 && currentUserContribution <= etherMaxContrib))) {
            return true;
        }
        return false;
    }
    
    function processContribution(address _contributor, uint256 _amount) internal checkContribution {
        uint round = uint(currentRound);
        if (round == 0) require(now <= currentRoundEndTime, "First round has passed");
        RoundData storage roundInfo = roundDetails[round];
        uint tokensToGiveUser = SafeMath.mul(_amount, roundInfo.tokenRate);
        uint tempTotalTokens = SafeMath.add(tokensToGiveUser, roundInfo.totalTokensSold);
        
        uint weiSpent = 0;
        uint weiLeft = 0;
        uint totalTokensToSend = 0;
        if (tempTotalTokens < roundInfo.tokenCount) {
            weiSpent = _amount;
            totalTokensToSend = tokensToGiveUser;
            roundInfo.totalTokensSold = tempTotalTokens;
        } else {
            uint leftTokens = SafeMath.sub(roundInfo.tokenCount, roundInfo.totalTokensSold);
            weiSpent = SafeMath.div(leftTokens, roundInfo.tokenRate);
            roundInfo.totalTokensSold = roundInfo.tokenCount;
            totalTokensToSend = leftTokens;
            weiLeft = SafeMath.sub(_amount, weiSpent);            
            if (round == 0) {
                treasury.onCrowdSaleR1End(_amount);
            }
            currentRoundEndTime = now;
            paused = true;
        }
        
        Contribution storage userContribGlobal = userContributonDetails[_contributor][round];
        userContribGlobal.amount = SafeMath.add(userContribGlobal.amount, weiSpent);
        
        processPayment(_contributor, weiSpent, totalTokensToSend);
        if (weiLeft > 0) {
            if (round == 2) {
                erc20Token.finishMinting();
                currentRound = Round.R3Ended;
            }
            _contributor.transfer(weiLeft);
        }
    }

    function processPayment(address contributor, uint etherAmount, uint256 tokenAmount) internal {
        erc20Token.mint(contributor, tokenAmount, true);
        treasury.processContribution.value(etherAmount)();
        emit LogContribution(contributor, etherAmount, tokenAmount);
    }
}
