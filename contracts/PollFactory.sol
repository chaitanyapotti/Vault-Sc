pragma solidity ^0.4.25;

import "./Treasury.sol";
import "./Poll/BoundPoll.sol";
import "./Poll/UnBoundPoll.sol";


contract PollFactory is Treasury {

    struct XfrData {
        address xfrPollAddress;
        uint amountRequested;
    }

    uint public constant KILL_POLL_DURATION = 7689600; //seconds (89 days)
    uint public constant XFR_POLL_DURATION = 2592000; //seconds (30 days)
    uint public constant TAP_INCREMENT_FACTOR = 150;

    address[8] public killPollAddresses;
    uint8[8] public killPollStartDates;
    address public vaultMembershipAddress;
    XfrData[2] public xfrPollData;
    IERC1261 public vaultMembership;
    BoundPoll public currentKillPoll;
    UnBoundPoll public tapPoll;

    uint public currentKillPollIndex;
    uint public killAcceptancePercent;
    uint public tapAcceptancePercent;
    uint public xfrRejectionPercent;
    uint public minQuorum;
    uint public capPercent;
    uint public splineHeightAtPivot;
    uint public withdrawnTillNow;

    event RefundStarted(address _startedBy);
    event Withdraw(uint amountWei);

    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, 
    uint8[8] _killPollStartDates, address _vaultMembershipAddress, uint _capPercent, uint _killAcceptancePercent,
    uint _minQuorum, uint _xfrRejectionPercent, uint _tapAcceptancePercent, address _lockedTokenAddress) 
        public Treasury(_erc20Token, _teamAddress, _initalFundRelease, _lockedTokenAddress) {
            //check for cap maybe
            // cap is 10^2 multiplied to actual percentage - already in poll
            require(_killAcceptancePercent < 85, "Kill Acceptance should be less than 85 %");
            require(_xfrRejectionPercent < 40, "At least 60% must accept xfr");
            require(_minQuorum < 5000, "Cannot require more than 5000 to kill");
            require(_tapAcceptancePercent > 60, "At least 60% must accept tap increment");
            minQuorum = _minQuorum;
            capPercent = _capPercent;
            killAcceptancePercent = _killAcceptancePercent;
            xfrRejectionPercent = _xfrRejectionPercent;
            tapAcceptancePercent = _tapAcceptancePercent;
            vaultMembershipAddress = _vaultMembershipAddress;
            killPollStartDates = _killPollStartDates;
            address[] memory protocol = new address[](1);
            protocol[0] = _vaultMembershipAddress;
            bytes32[] memory proposal = new bytes32[](1);
            proposal[0] = stringToBytes32("yes");
            for (uint8 index = 0; index < _killPollStartDates.length; index++) {
                address killPoll = new BoundPoll(protocol, proposal, erc20Token, capPercent, 
                stringToBytes32("Vault"), 
                stringToBytes32("Kill"), 
                stringToBytes32("Token Proportional Capped Bound"),
                killPollStartDates[index], KILL_POLL_DURATION);

                killPollAddresses[index] = killPoll;
            }
        
            currentKillPoll = BoundPoll(killPollAddresses[0]);
            currentKillPollIndex = 0;
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
    }

    function increaseTap() external onlyOwner onlyDuringGovernance {
        if (canIncreaseTap()) {
            splineHeightAtPivot = SafeMath.add(splineHeightAtPivot, SafeMath.mul(SafeMath.sub(now, 
                pivotTime), currentTap));
            pivotTime = now;
            currentTap = SafeMath.div(SafeMath.mul(TAP_INCREMENT_FACTOR, currentTap), 100);
            delete tapPoll;
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
        require(pollData.xfrPollAddress == address(0), "Poll running/funds not withdrawn");
        address[] memory protocol = new address[](1);
        protocol[0] = vaultMembershipAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("No");
        address xfrPoll = new BoundPoll(protocol, proposal, erc20Token, capPercent, 
                stringToBytes32("Vault"), 
                stringToBytes32("Exceptional Fund Request"), 
                stringToBytes32("Token Proportional Capped Bound"),
                now + 1, XFR_POLL_DURATION);

        pollData.xfrPollAddress = xfrPoll;
        pollData.amountRequested = _amountToWithdraw;
    }

    function withdrawXfrAmount() external onlyOwner onlyDuringGovernance {
        uint withdrawlAmount = 0;
        for (var index = 0; index < xfrPollData.length; index++) {
            XfrData storage pollData = xfrPollData[index];
            BoundPoll xfrPoll = BoundPoll(pollData.xfrPollAddress);
            if (xfrPoll.hasPollEnded()) {
                if (canWithdrawXfr(index)) {
                    withdrawlAmount = SafeMath.add(withdrawlAmount, pollData.amountRequested);  
                }
                pollData.xfrPollAddress = address(0);
                pollData.amountRequested = 0;                    
            }            
        }
        require(withdrawlAmount > 0, "No Withdrawable amount");
        teamAddress.transfer(withdrawlAmount);
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
    }

    function firstWithdraw() external onlyOwner onlyDuringGovernance {
        require(firstWithdrawAmount > 0);
        uint amount = firstWithdrawAmount;
        firstWithdrawAmount = 0;
        require(amount < SafeMath.div(address(this).balance, 10), "Can't withdraw such amount");
        teamAddress.transfer(amount);
        emit Withdraw(amount);
    }

    function canIncreaseTap() public view returns (bool) {
        require(address(tapPoll) != address(0), "No tap poll exists yet");

        if (SafeMath.div(tapPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            tapAcceptancePercent && !canKill()) 
            return true;

        return false;
    }

    function canWithdrawXfr(uint8 _pollNumber) public view returns (bool) {
        require(_pollNumber <= 1, "Max 2 polls allowed at a time");
        XfrData storage pollData = xfrPollData[_pollNumber];
        require(pollData.xfrPollAddress != address(0), "No poll is running at that number");
        BoundPoll xfrPoll = BoundPoll(pollData.xfrPollAddress);

        if (SafeMath.div(xfrPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) <= 
            xfrRejectionPercent && !canKill()) 
            return true;

        return false;
    }

    function canKill() public view returns (bool) onlyDuringGovernance {  
        if (((SafeMath.div(currentKillPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            killAcceptancePercent) && (currentKillPoll.getVoterCount(0) > minQuorum)) || 
            (SafeMath.div(currentKillPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) == 100)) 
            return true;

        return false;
    }

    function canWithdraw() public view returns (bool) {
        if (canKill()) {
            return false;
        }
        return true;
    }

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        // solhint-disable-next-line
        assembly {
            result := mload(add(source, 32))
        }
    }
}