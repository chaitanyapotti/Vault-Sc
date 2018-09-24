pragma solidity ^0.4.25;

import "./Treasury.sol";
import "./Poll/BoundPoll.sol";
import "./Poll/UnBoundPoll.sol";


contract PollManager is Treasury {

    struct XfrData {
        address xfrPollAddress;
        uint amountRequested;
    }

    uint public constant KILL_POLL_DURATION = 7689600; //seconds (89 days)
    uint public constant XFR_POLL_DURATION = 2592000; //seconds (30 days)
    uint public constant TAP_INCREMENT_FACTOR = 150;
    address[8] public killPollAddresses;
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
    uint public tapWithdrawableAmount;
    uint8[8] public killPollStartDates;

    event RefundStarted(address _startedBy);
    event Withdraw(uint amountWei);

    constructor(address _erc20Token, address _teamAddress, uint _initalFundRelease, 
    uint8[8] _killPollStartDates, address _vaultMembershipAddress, uint _capPercent, uint _killAcceptancePercent,
    uint _minQuorum, uint _xfrRejectionPercent, uint _tapAcceptancePercent, address _lockedTokenAddress) 
        public Treasury(_erc20Token, _teamAddress, _initalFundRelease, _lockedTokenAddress) {
            //check for cap maybe
            //require(_minQuorum > ) 0.5 * total vault members maybe?
            require(_capPercent < 10, "Cap weight Should not be more than 10 %");
            require(_killAcceptancePercent > 60, "Kill Acceptance should be more than 60 %");
            require(_xfrRejectionPercent < 60, "At least 60% must reject xfr");
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
        //create all kill polls
        //dynamically create otp
        //dynamically create tap poll
        }

    function executeKill() external {
        require(currentKillPoll.hasPollEnded(), "Poll hasn't ended yet");
        //initial high cap weight after r1 - reduces as more rounds come by
        if (canKill()) {
            state = TreasuryState.Killed;
            erc20Token.burnFrom(lockedTokenAddress, erc20Token.balanceOf(lockedTokenAddress));
            emit RefundStarted(msg.sender);
        } else if (currentKillPoll.hasPollEnded()) {
            currentKillPollIndex += 1;
            currentKillPoll = BoundPoll(killPollAddresses[currentKillPollIndex]);
        }
    }

    function createTapIncrementPoll(uint _startTime) external onlyOwner {
        require(state == TreasuryState.Governance, 
            "Can't create tap poll after treasury is killed or governance hasn't started");
        require(address(tapPoll) == 0, "Tap Increment poll already exists");
        require(_startTime > now, "Start time must be after now");
        address[] memory protocol = new address[](1);
        protocol[0] = vaultMembershipAddress;
        bytes32[] memory proposal = new bytes32[](1);
        proposal[0] = stringToBytes32("yes");
        tapPoll = new UnBoundPoll(protocol, proposal, erc20Token, capPercent, 
            stringToBytes32("Vault"), 
            stringToBytes32("Tap Increment Poll"), 
            stringToBytes32("Token Proportional Capped")
            , _startTime, 0);
    }

    function increaseTap() external onlyOwner {
        if (canIncreaseTap()) {
            tapWithdrawableAmount = SafeMath.add(tapWithdrawableAmount, SafeMath.mul(SafeMath.sub(now, 
                lastTapIncrementedAt), currentTap));
            lastTapIncrementedAt = now;
            currentTap = SafeMath.div(SafeMath.mul(TAP_INCREMENT_FACTOR, currentTap), 100);
            delete tapPoll;
        }
    }

    function createXfr(uint _startTime, uint8 _pollNumber, uint _amountToWithdraw) external onlyOwner {
        require(state == TreasuryState.Governance,
            "Can't create Xfr after treasury is killed or governance hasn't started");
        require(_startTime > now, "Start Time must be after now");
        require(_pollNumber <= 1, "Max 2 polls allowed at a time");
        require(_amountToWithdraw <= SafeMath.div(address(this).balance, 4), "Can't withdraw > 25% of balance");
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
                _startTime, XFR_POLL_DURATION);

        pollData.xfrPollAddress = xfrPoll;
        pollData.amountRequested = _amountToWithdraw;
    }

    function withdrawXfrAmount(uint8 _pollNumber) external onlyOwner {
        XfrData storage pollData = xfrPollData[_pollNumber];
        uint withdrawlAmount = pollData.amountRequested;
        BoundPoll xfrPoll = BoundPoll(pollData.xfrPollAddress);
        if (canWithdrawXfr(_pollNumber)) {
            pollData.xfrPollAddress = address(0);
            pollData.amountRequested = 0;
            teamAddress.transfer(withdrawlAmount);
        } else if (xfrPoll.hasPollEnded()) {
            pollData.xfrPollAddress = address(0);
            pollData.amountRequested = 0; 
        }

    }

    function withdrawAmount(uint _amount) external onlyOwner {
        require(canWithdraw(), "cannot withdraw now");
        require(_amount < address(this).balance, "Insufficient funds");
        tapWithdrawableAmount = SafeMath.add(tapWithdrawableAmount, SafeMath.mul(SafeMath.sub(now, 
                lastTapIncrementedAt), currentTap));
        require(tapWithdrawableAmount >= _amount, "Not allowed");
        lastTapIncrementedAt = now;
        tapWithdrawableAmount = SafeMath.sub(tapWithdrawableAmount, _amount);
        teamAddress.transfer(_amount);
    }

    function firstWithdraw() external onlyOwner {
        require(firstWithdrawAmount > 0 && state == TreasuryState.Governance);
        uint amount = firstWithdrawAmount;
        firstWithdrawAmount = 0;
        teamAddress.transfer(amount);
        emit Withdraw(amount);
    }

    function canIncreaseTap() public view returns (bool) {
        require(state == TreasuryState.Governance, 
            "Can't increase tap after treasury is killed or governance hasn't started");
        require(address(tapPoll) != address(0), "No tap poll exists yet");
        require(tapPoll.getVoterCount(0) > minQuorum, "Enough people haven't voted");

        if (SafeMath.div(tapPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            tapAcceptancePercent && !canKill()) 
            return true;

        return false;
    }

    function canWithdrawXfr(uint8 _pollNumber) public view returns (bool) {
        require(state == TreasuryState.Governance, "Can't withdraw after treasury is killed");
        require(_pollNumber <= 1, "Max 2 polls allowed at a time");
        XfrData storage pollData = xfrPollData[_pollNumber];
        require(pollData.xfrPollAddress != address(0), "No poll is running at that number");
        BoundPoll xfrPoll = BoundPoll(pollData.xfrPollAddress);
        require(xfrPoll.hasPollEnded(), "Poll hasn't ended yet");
        require(xfrPoll.getVoterCount(0) > minQuorum, "Enough people haven't voted");

        if (SafeMath.div(xfrPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) <= 
            xfrRejectionPercent && !canKill()) 
            return true;

        return false;
    }

    function canKill() public view returns (bool) {
        require(state == TreasuryState.Governance, "Can't kill yet");        
        require(currentKillPoll.getVoterCount(0) > minQuorum, "Enough people haven't voted");
        if (SafeMath.div(currentKillPoll.getVoteTally(0), erc20Token.getTokensUnderGovernance()) >= 
            killAcceptancePercent) 
            return true;

        return false;
    }

    function canWithdraw() public view returns (bool) {
        require(state == TreasuryState.Governance, "can't withdraw after treasury is killed");
        if (address(currentKillPoll) != address(0) && canKill()) {
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