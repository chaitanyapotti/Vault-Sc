pragma solidity ^0.4.25;

import "./Treasury.sol";
import "./Poll/BoundPoll.sol";
import "./Poll/UnBoundPoll.sol";


contract PollFactory is Treasury {

    struct XfrData {
        address xfrPollAddress;
        uint amountRequested;
    }

    uint public constant KILL_POLL_DURATION = 89 days; //seconds (89 days)
    uint public constant XFR_POLL_DURATION = 30 days; //seconds (30 days)
    
    address[8] public killPollAddresses;
    uint public killPollStartDate;
    address public vaultMembershipAddress;
    XfrData[2] public xfrPollData;
    BoundPoll public currentKillPoll;
    UnBoundPoll public tapPoll;
    mapping(address => bool) public pollAddresses;

    uint public currentKillPollIndex;
    uint public killAcceptancePercent;
    uint public tapAcceptancePercent;
    uint public xfrRejectionPercent;
    uint public capPercent;
    uint public splineHeightAtPivot;
    uint public withdrawnTillNow;
    uint public killPollsDeployed;

    event RefundStarted(address _startedBy);
    event Withdraw(uint amountWei);
    event TapIncreased(uint weiAmount);
    event XfrPollCreated(address xfrAddress);
    event TapPollCreated(address tapPollAddress);

    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, uint _initialTap,
    uint _killPollStartDate, address _vaultMembershipAddress, uint _capPercent, uint _killAcceptancePercent,
    uint _xfrRejectionPercent, uint _tapAcceptancePercent, address _lockedTokenAddress, uint _tapIncrementFactor) 
        public Treasury(_erc20Token, _teamAddress, _initalFundRelease, _lockedTokenAddress, _initialTap, 
        _tapIncrementFactor) {
            //check for cap maybe
            // cap is 10^2 multiplied to actual percentage - already in poll
            require(_killAcceptancePercent < 85, "Kill Acceptance should be less than 85 %");
            require(_xfrRejectionPercent < 40, "At least 60% must accept xfr");
            require(_tapAcceptancePercent > 60, "At least 60% must accept tap increment");
            capPercent = _capPercent;
            killAcceptancePercent = _killAcceptancePercent;
            xfrRejectionPercent = _xfrRejectionPercent;
            tapAcceptancePercent = _tapAcceptancePercent;
            vaultMembershipAddress = _vaultMembershipAddress;
            killPollStartDate = _killPollStartDate;
            tapIncrementFactor = _tapIncrementFactor;
        }

    function createKillPolls() external {
        require(killPollsDeployed == 0, "Polls have already been deployed");
        for (uint8 index = 0; index < 4; index++) {
            createKillPoll(index);
        }
        currentKillPoll = BoundPoll(killPollAddresses[0]);
        currentKillPollIndex = 0;
    }

    function createRemainingKillPolls() external {
        require(killPollsDeployed == 4, "First Polls have already not been deployed");
        for (uint8 index = 4; index < 8; index++) {
            createKillPoll(index);
        }
    }

    function executeKill() external {
        require(currentKillPoll.hasPollEnded(), "Poll hasn't ended yet");
        if (canKill()) {
            state = TreasuryState.Killed;
            erc20Token.burnFrom(lockedTokenAddress, erc20Token.balanceOf(lockedTokenAddress));
            emit RefundStarted(msg.sender);
        } else {
            currentKillPollIndex += 1;
            currentKillPoll = BoundPoll(killPollAddresses[currentKillPollIndex]);
        }
    }

    function createTapIncrementPoll() external onlyOwner onlyDuringGovernance {        
        require(address(tapPoll) == 0, "Tap Increment poll already exists");
        address[] memory protocol = new address[](1);
        protocol[0] = vaultMembershipAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("yes");
        tapPoll = new UnBoundPoll(protocol, proposal, erc20Token, capPercent, 
            stringToBytes32("Vault"), 
            stringToBytes32("Tap Increment Poll"), 
            stringToBytes32("Token Proportional Capped")
            , now + 1, 0);
        
        pollAddresses[address(tapPoll)] = true;
        emit TapPollCreated(address(tapPoll));
    }

    function increaseTap() external onlyOwner onlyDuringGovernance {
        if (canIncreaseTap()) {
            splineHeightAtPivot = SafeMath.add(splineHeightAtPivot, SafeMath.mul(SafeMath.sub(now, 
                pivotTime), currentTap));
            pivotTime = now;
            currentTap = SafeMath.div(SafeMath.mul(tapIncrementFactor, currentTap), 100);
            delete tapPoll;
            emit TapIncreased(currentTap);
        }
    }

    function createXfr(uint _amountToWithdraw) external onlyOwner 
        onlyDuringGovernance {
        uint _pollNumber = 0;
        XfrData storage pollData0 = xfrPollData[0];
        if (pollData0.xfrPollAddress != address(0)) {
            XfrData storage pollData1 = xfrPollData[1];
            require(pollData1.xfrPollAddress == address(0), "Max 2 polls allowed at a time");
            _pollNumber = 1;
        }
        require(_amountToWithdraw <= SafeMath.div(address(this).balance, 10), "Can't withdraw > 10% of balance");
        XfrData storage pollData = xfrPollData[_pollNumber];
        address[] memory protocol = new address[](1);
        protocol[0] = vaultMembershipAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("No");
        address xfrPoll = new BoundPoll(protocol, proposal, erc20Token, capPercent, 
                stringToBytes32("Vault"), 
                stringToBytes32("Exceptional Fund Request"), 
                stringToBytes32("Token Proportional Capped Bound"),
                now + 1, XFR_POLL_DURATION);

        pollAddresses[xfrPoll] = true;
        pollData.xfrPollAddress = xfrPoll;
        pollData.amountRequested = _amountToWithdraw;
        emit XfrPollCreated(xfrPoll);
    }

    function withdrawXfrAmount() external onlyOwner onlyDuringGovernance {
        uint withdrawlAmount = 0;
        uint withdrawFactor = canWithdrawXfr();
        XfrData storage pollData1 = xfrPollData[0];
        XfrData storage pollData2 = xfrPollData[1];
        if (withdrawFactor == 1 || withdrawFactor == 3) {
            withdrawlAmount = SafeMath.add(withdrawlAmount, pollData1.amountRequested);  
            pollData1.xfrPollAddress = address(0);
            pollData1.amountRequested = 0;                       
        } 
        if (withdrawFactor == 2 || withdrawFactor == 3) {
            withdrawlAmount = SafeMath.add(withdrawlAmount, pollData2.amountRequested);  
            pollData2.xfrPollAddress = address(0);
            pollData2.amountRequested = 0;                    
        }
        require(withdrawlAmount > 0, "No Withdrawable amount");
        teamAddress.transfer(withdrawlAmount);
        emit Withdraw(withdrawlAmount);
    }

    function onCrowdSaleR1End() external onlyCrowdSale {
        state = TreasuryState.Governance;
        splineHeightAtPivot = initalFundRelease;
        pivotTime = now;
        currentTap = initialTap;
    }

    function withdrawAmount(uint _amount) external onlyOwner onlyDuringGovernance {
        require(canWithdraw(), "cannot withdraw now");
        require(_amount < address(this).balance, "Insufficient funds");
        splineHeightAtPivot = SafeMath.add(splineHeightAtPivot, SafeMath.mul(SafeMath.sub(now, 
                pivotTime), currentTap));
        require(_amount <= splineHeightAtPivot - withdrawnTillNow, "Not allowed");
        pivotTime = now;
        splineHeightAtPivot = SafeMath.sub(splineHeightAtPivot, _amount);
        withdrawnTillNow += _amount;    
        teamAddress.transfer(_amount);
        emit Withdraw(_amount);
    }

    function isPollAddress(address _address) external view returns (bool) {
        return pollAddresses[_address];
    }

    function isKillPollDeployed() external view returns (bool) {
        return killPollsDeployed == killPollAddresses.length;
    }

    function getKillPollStartDate() external view returns (uint) {
        return killPollStartDate;
    }

    function canIncreaseTap() public view returns (bool) {
        require(address(tapPoll) != address(0), "No tap poll exists yet");

        if (SafeMath.div(tapPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            tapAcceptancePercent && !canKill()) 
            return true;

        return false;
    }

    function canWithdrawXfr() public view returns (uint) {
        XfrData storage pollData = xfrPollData[0];
        XfrData storage pollData1 = xfrPollData[1];
        BoundPoll xfrPoll1 = BoundPoll(pollData.xfrPollAddress);
        BoundPoll xfrPoll2 = BoundPoll(pollData1.xfrPollAddress);
        uint returnedValue1 = 0;
        uint returnedValue2 = 0;
        if (!canKill()) {
            if (SafeMath.div(xfrPoll1.getVoteTally(0), erc20Token.getTokensUnderGovernance()) <= 
            xfrRejectionPercent && xfrPoll1.hasPollEnded()) {
                returnedValue1 = 1;
            }

            if (SafeMath.div(xfrPoll2.getVoteTally(0), erc20Token.getTokensUnderGovernance()) <= 
            xfrRejectionPercent && xfrPoll2.hasPollEnded()) {
                returnedValue2 = 2;
            }
        }            
        return returnedValue1 + returnedValue2;
    }

    function canKill() public onlyDuringGovernance view returns (bool) {        
        if ((SafeMath.div(currentKillPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            killAcceptancePercent) && (currentKillPoll.getVoterCount(0) > SafeMath.div(SafeMath.mul(5, 
            totalEtherRaised), 100000000000000000000))) {return true;}

        return false;
    }

    function canWithdraw() public view returns (bool) {
        if (canKill()) {
            return false;
        }
        return true;
    }

    function createKillPoll(uint8 index) internal {
        address[] memory protocol = new address[](1);
        protocol[0] = vaultMembershipAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("yes");
        uint startDate = killPollStartDate + index * (90 days);
        address killPoll = new BoundPoll(protocol, proposal, erc20Token, capPercent, 
            stringToBytes32("Vault"), 
            stringToBytes32("Kill"), 
            stringToBytes32("Token Proportional Capped Bound"),
            startDate, KILL_POLL_DURATION);
        pollAddresses[killPoll] = true;
        killPollAddresses[index] = killPoll;
        killPollsDeployed += 1;
    }

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        // solhint-disable-next-line
        assembly {
            result := mload(add(source, 32))
        }
    }
}