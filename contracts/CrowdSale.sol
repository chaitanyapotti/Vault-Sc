pragma solidity ^0.4.25;

import "./Token/LockedTokens.sol";
import "./Token/DaicoToken.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol"; //need to check if necessary
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Interfaces/ICrowdSaleTreasury.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol"; //need to check if necessary


contract CrowdSale is Pausable, Ownable {
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
        uint tokenRate; //rate is in tokens/wei
        uint totalTokensSold;
        uint endTime;
    }

    RoundData[3] public roundDetails;
    DaicoToken public erc20Token;
    ICrowdSaleTreasury public treasury;
    LockedTokens public lockedTokens;
    IERC1261 public vaultMembership;
    IERC1261 public membership;


    uint public etherMinContrib;
    uint public etherMaxContrib;
    uint public currentRoundEndTime;
    address[] public foundationTokenWallets; 
    uint[] public foundationAmounts;
    bool internal mintedFoundationTokens;
    mapping(address => Contribution[3]) public userContributonDetails;
    Round public currentRound;

    event LogContribution(address contributor, uint etherAmount, uint tokenAmount);

    modifier checkContribution() {
        require(isValidContribution() && canContribute(msg.sender));
        _;
    }

    constructor (uint _etherMinContrib, uint _etherMaxContrib, uint _r1EndTime, 
        uint[3] _roundTokenCounts, uint[3] _roundtokenRates, address _lockedTokensAddress, 
        address _treasuryAddress, address _membershipAddress, address _erc20TokenAddress, 
        address _vaultMembershipAddress, address[] _foundationTokenWallets, uint[] _foundationAmounts) public {

        lockedTokens = LockedTokens(_lockedTokensAddress);
        erc20Token = DaicoToken(_erc20TokenAddress);
        vaultMembership = IERC1261(_vaultMembershipAddress);
        treasury = ICrowdSaleTreasury(_treasuryAddress);
        membership = IERC1261(_membershipAddress);

        assert(_foundationTokenWallets.length == _foundationAmounts.length);
        
        foundationTokenWallets = _foundationTokenWallets;
        foundationAmounts = _foundationAmounts;

        etherMinContrib = _etherMinContrib;
        etherMaxContrib = _etherMaxContrib;

        roundDetails[0] = RoundData({
            tokenCount: _roundTokenCounts[0], tokenRate: _roundtokenRates[0], endTime: _r1EndTime, totalTokensSold: 0
        });
        roundDetails[1] = RoundData({
            tokenCount: _roundTokenCounts[1], tokenRate: _roundtokenRates[1], endTime: 0, totalTokensSold: 0
        });
        roundDetails[2] = RoundData({
            tokenCount: _roundTokenCounts[2], tokenRate: _roundtokenRates[2], endTime: 0, totalTokensSold: 0
        });

        pause();
    }

    function () public payable whenNotPaused {
        processContribution(msg.sender, msg.value);
    }

    function mintFoundationTokens() public {
        require(!mintedFoundationTokens, "Already minted foundation tokens");
        mintedFoundationTokens = true;
        uint foundationTokensTotal = 0;        
        for (uint index = 0; index <= foundationTokenWallets.length; index++) {
            foundationTokensTotal += foundationAmounts[index];
            lockedTokens.addTokens(foundationTokenWallets[index], foundationAmounts[index], now + 365 days);
        }
        
        uint foundationAssert = erc20Token.getTotalMintableSupply() - roundDetails[0].tokenCount - 
            roundDetails[0].tokenCount - roundDetails[2].tokenCount;
        
        assert(foundationTokensTotal == foundationAssert);
        erc20Token.mint(address(lockedTokens), foundationTokensTotal, false);
    }

    function finalizeRoundOne() public {
        RoundData storage roundInfo = roundDetails[0];
        if (roundInfo.totalTokensSold == roundInfo.tokenCount) {
            treasury.onCrowdSaleR1End();
        } else if (now >= currentRoundEndTime && roundInfo.totalTokensSold < roundInfo.tokenCount) {
            pause();
            currentRound = Round.CrowdSaleRefund;
            treasury.enableCrowdsaleRefund();
        }
    }

    function startNewRound() public onlyOwner whenPaused {
        require(currentRound != Round.CrowdSaleRefund, "Crowdsale is killed already");
        require(currentRound != Round.Round3, "Already in round 3");
        require(now - currentRoundEndTime > 24 hours, "Must wait 24 hrs to start another round");
        if (currentRoundEndTime != 0) {  
            currentRound = Round(uint(currentRound) + 1);
        } else {
            require(now < roundDetails[0].endTime, "First round has elapsed");
            require(treasury.isKillPollDeployed(), "Kills have not been deployed");
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

        uint tokensToGiveUser = SafeMath.mul(_amount, roundInfo.tokenRate);
        uint tempTotalTokens = SafeMath.add(tokensToGiveUser, roundInfo.totalTokensSold);
        uint weiSpent = 0;
        uint weiLeft = 0;
        uint totalTokensToSend = 0;
        if (tempTotalTokens <= roundInfo.tokenCount) {
            weiSpent = _amount;
            totalTokensToSend = tokensToGiveUser;
            roundInfo.totalTokensSold = tempTotalTokens;
        } else {
            uint leftTokens = SafeMath.sub(roundInfo.tokenCount, roundInfo.totalTokensSold);
            weiSpent = SafeMath.div(leftTokens, roundInfo.tokenRate);
            roundInfo.totalTokensSold = roundInfo.tokenCount;
            totalTokensToSend = leftTokens;
            weiLeft = SafeMath.sub(_amount, weiSpent);
            if (round != 2) {
                RoundData storage nextRoundInfo = roundDetails[round + 1];
                uint rightTokens = SafeMath.mul(weiLeft, nextRoundInfo.tokenRate);
                nextRoundInfo.totalTokensSold = rightTokens;
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
        if (round == 2 && weiLeft > 0) {
            erc20Token.finishMinting();
            _contributor.transfer(weiLeft); 
        }
    }

    function processPayment(address contributor, uint etherAmount, uint256 tokenAmount) internal {
        erc20Token.mint(contributor, tokenAmount, true);
        treasury.processContribution.value(etherAmount)();
        emit LogContribution(contributor, etherAmount, tokenAmount);
    }
}
