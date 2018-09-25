pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract LockedTokens is Ownable {
    struct Tokens {
        uint amount;
        uint lockEndTime;
        bool released;
    }

    event TokensUnlocked(address _to, uint _value);
    event TokensLocked(address _to, uint _value, uint _endTime);

    IERC20 public token;
    address public crowdSaleAddress;
    mapping(address => Tokens[]) public walletTokens;

    constructor(IERC20 _token) public {
        token = _token;
    }

    function setCrowdSaleAddress(address _crowdSaleAddress) external onlyOwner {
        require(crowdSaleAddress == address(0));
        crowdSaleAddress = _crowdSaleAddress;
    }

    function addTokens(address _to, uint _amount, uint _lockEndTime) external {
        require(msg.sender == crowdSaleAddress);
        walletTokens[_to].push(Tokens({amount: _amount, lockEndTime: _lockEndTime, released: false}));
        emit TokensLocked(_to, _amount, _lockEndTime);
    }

    function releaseTokens() public {
        require(walletTokens[msg.sender].length > 0);

        for (uint i = 0; i < walletTokens[msg.sender].length; i++) {
            if (!walletTokens[msg.sender][i].released && now >= walletTokens[msg.sender][i].lockEndTime) {
                walletTokens[msg.sender][i].released = true;
                token.transfer(msg.sender, walletTokens[msg.sender][i].amount);
                emit TokensUnlocked(msg.sender, walletTokens[msg.sender][i].amount);
            }
        }
    }
}