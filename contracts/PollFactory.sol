pragma solidity ^0.4.25;

import "./Treasury.sol";
import "./Poll/BoundPoll.sol";
import "./Poll/UnBoundPoll.sol";


contract PollFactory is Treasury {

    struct XfrData {
        address xfrPollAddress;
        uint amountRequested;
        uint startDate;
    }

    uint public constant KILL_POLL_DURATION = 89 days; //seconds (89 days)
    uint public constant XFR_POLL_DURATION = 30 days; //seconds (30 days)
    
    address[8] public killPollAddresses;
    uint public killPollStartDate;
    address[] public vaultMembershipAddress;
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

    event RefundStarted(address contractAddress, uint consensus);
    event Withdraw(uint amountWei);
    event XfrWithdraw(uint amountWei, address contractAddress, uint consensus);
    event TapIncreased(uint amountWei, address contractAddress, uint consensus);
    event XfrPollCreated(address xfrAddress);
    event TapPollCreated(address tapPollAddress);

    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, uint _initialTap,
    uint _killPollStartDate, address _vaultMembershipAddress, uint _capPercent, uint _killAcceptancePercent,
    uint _xfrRejectionPercent, uint _tapAcceptancePercent, address _lockedTokenAddress, uint _tapIncrementFactor) 
        public Treasury(_erc20Token, _teamAddress, _initalFundRelease, _lockedTokenAddress, _initialTap, 
        _tapIncrementFactor) {
            //check for cap maybe
            // cap is 10^2 multiplied to actual percentage - already in poll
            require(_killAcceptancePercent <= 80, "Kill Acceptance should be less than 80 %");
            require(_xfrRejectionPercent <= 50, "At least 50% must accept xfr");
            require(_tapAcceptancePercent >= 50, "At least 50% must accept tap increment");
            capPercent = _capPercent;
            killAcceptancePercent = _killAcceptancePercent;
            xfrRejectionPercent = _xfrRejectionPercent;
            tapAcceptancePercent = _tapAcceptancePercent;
            vaultMembershipAddress.push(_vaultMembershipAddress);
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
        uint code;
        uint consensus;
        (code, consensus) = canKill();
        if (code == 11) {
            state = TreasuryState.Killed;
            erc20Token.burnFrom(lockedTokenAddress, erc20Token.balanceOf(lockedTokenAddress));
            emit RefundStarted(address(currentKillPoll), consensus);
        } else {
            currentKillPollIndex += 1;
            currentKillPoll = BoundPoll(killPollAddresses[currentKillPollIndex]);
        }
    }

    function createTapIncrementPoll() external onlyOwner onlyDuringGovernance {        
        require(address(tapPoll) == 0, "Tap Increment poll already exists");
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("yes");
        tapPoll = new UnBoundPoll(vaultMembershipAddress, proposal, erc20Token, capPercent, 
            stringToBytes32("Vault"), 
            stringToBytes32("Tap Increment Poll"), 
            stringToBytes32("Token Proportional Capped")
            , now + 1, 0);
        
        pollAddresses[address(tapPoll)] = true;
        emit TapPollCreated(address(tapPoll));
    }

    function increaseTap() external onlyOwner onlyDuringGovernance {
        uint code;
        uint consensus;
        (code, consensus) = canIncreaseTap();
        require(code == 11, "Can't increase tap now");
        splineHeightAtPivot = SafeMath.add(splineHeightAtPivot, SafeMath.mul(SafeMath.sub(now, 
            pivotTime), currentTap));
        pivotTime = now;
        currentTap = SafeMath.div(SafeMath.mul(tapIncrementFactor, currentTap), 100);
        emit TapIncreased(currentTap, address(tapPoll), consensus);
        delete tapPoll;
    }

    function createXfr(uint _amountToWithdraw) external onlyOwner 
        onlyDuringGovernance {
        uint _pollNumber = 0;
        XfrData storage pollData0 = xfrPollData[0];
        XfrData storage pollData1 = xfrPollData[1];
        if (pollData0.xfrPollAddress != address(0) && now > (pollData0.startDate + 33 days)) {
            pollData0.xfrPollAddress = address(0);
            pollData0.amountRequested = 0;
        }
        if (pollData1.xfrPollAddress != address(0) && now > (pollData1.startDate + 33 days)) {
            pollData1.xfrPollAddress = address(0);
            pollData1.amountRequested = 0;
        }        
        if (pollData0.xfrPollAddress != address(0)) {
            require(pollData1.xfrPollAddress == address(0), "Max 2 polls allowed at a time");
            _pollNumber = 1;
        }
        require(_amountToWithdraw <= SafeMath.div(address(this).balance, 10), "Can't withdraw > 10% of balance");
        XfrData storage pollData = xfrPollData[_pollNumber];
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("No");
        address xfrPoll = new BoundPoll(vaultMembershipAddress, proposal, erc20Token, capPercent, 
                stringToBytes32("Vault"), 
                stringToBytes32("Exceptional Fund Request"), 
                stringToBytes32("Token Proportional Capped Bound"),
                now + 1, XFR_POLL_DURATION);

        pollAddresses[xfrPoll] = true;
        pollData.xfrPollAddress = xfrPoll;
        pollData.amountRequested = _amountToWithdraw;
        pollData.startDate = now;
        emit XfrPollCreated(xfrPoll);
    }

    function withdrawXfrAmount() external onlyOwner onlyDuringGovernance {
        uint withdrawlAmount = 0;
        uint code1; 
        uint code2; 
        uint consensus1; 
        uint consensus2;
        (code1, code2, consensus1, consensus2) = canWithdrawXfr();
        XfrData storage pollData1 = xfrPollData[0];
        XfrData storage pollData2 = xfrPollData[1];
        if (code1 == 11) {
            emit XfrWithdraw(pollData1.amountRequested, pollData1.xfrPollAddress, consensus1);
            withdrawlAmount = SafeMath.add(withdrawlAmount, pollData1.amountRequested);  
            pollData1.xfrPollAddress = address(0);
            pollData1.amountRequested = 0;
        } 
        if (code2 == 11) {
            emit XfrWithdraw(pollData2.amountRequested, pollData2.xfrPollAddress, consensus2);
            withdrawlAmount = SafeMath.add(withdrawlAmount, pollData2.amountRequested);  
            pollData2.xfrPollAddress = address(0);
            pollData2.amountRequested = 0;                    
        }
        require(withdrawlAmount > 0 && withdrawlAmount <= address(this).balance, "No Withdrawable amount");
        teamAddress.transfer(withdrawlAmount);
    }

    function onCrowdSaleR1End(uint _amount) external onlyCrowdSale {
        require(initalFundRelease <= SafeMath.div((address(this).balance + _amount), 10), "Can't withdraw amount");
        state = TreasuryState.Governance;
        splineHeightAtPivot = initalFundRelease;
        pivotTime = now;
        currentTap = initialTap;
    }

    function withdrawAmount(uint _amount) external onlyOwner onlyDuringGovernance {
        uint code;
        uint consensus;
        (code, consensus) = canKill();
        require(code == 10, "cannot withdraw now");
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

    function canIncreaseTap() public view returns (uint code, uint consensus) {
        require(address(tapPoll) != address(0), "No tap poll exists yet");
        consensus = SafeMath.div(tapPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance());
        uint codeKill;
        uint consensusKill;
        (codeKill, consensusKill) = canKill();
        if (consensus >= tapAcceptancePercent && codeKill == 10)
            code = 11;
        else 
            code = 10;
    }

    function canWithdrawXfr() public view returns (uint code1, uint code2, uint consensus1, uint consensus2) {
        XfrData storage pollData = xfrPollData[0];
        XfrData storage pollData1 = xfrPollData[1];        
        BoundPoll xfrPoll1 = BoundPoll(pollData.xfrPollAddress);
        BoundPoll xfrPoll2 = BoundPoll(pollData1.xfrPollAddress);
        code1 = 10;
        code2 = 10;
        uint code;
        uint consensus;
        (code, consensus) = canKill();
        if (code == 10) {
            consensus1 = SafeMath.div(xfrPoll1.getVoteTally(0), erc20Token.getTokensUnderGovernance());
            if (consensus1 <= 
            xfrRejectionPercent && xfrPoll1.hasPollEnded() && now <= (pollData.startDate + 33 days)) {
                code1 = 11;    
            }
            consensus2 = SafeMath.div(xfrPoll2.getVoteTally(0), erc20Token.getTokensUnderGovernance());
            if (consensus2 <= 
            xfrRejectionPercent && xfrPoll2.hasPollEnded() && now <= (pollData1.startDate + 33 days)) {
                code2 = 11;
            }
        }
    }

    function canKill() public view returns (uint code, uint consensus) {
        consensus = SafeMath.div(currentKillPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance());
        if (consensus >= killAcceptancePercent && 
        (currentKillPoll.getVoterCount(0) > SafeMath.div(SafeMath.mul(5, totalEtherRaised), 100000000000000000000)))
            code = 11;
        else 
            code = 10;
    }

    function createKillPoll(uint8 index) internal {
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("yes");
        uint startDate = killPollStartDate + index * (90 days);
        address killPoll = new BoundPoll(vaultMembershipAddress, proposal, erc20Token, capPercent, 
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