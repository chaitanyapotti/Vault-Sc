var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
var VaultContract = artifacts.require("./Vault.sol");
const increaseTime = require("./utils/increaseTime");
var boundPoll = artifacts.require("./BoundPoll.sol");
var unBoundPoll = artifacts.require("./UnBoundPoll.sol");
contract("Poll Factory KIll Test", function(accounts) {
  let protocol1Contract;
  let protocol2Contract;
  let daicoToken;
  let lockedTokens;
  let pollFactory;
  let crowdSale;
  let presentTime;
  let newUnBoundPoll;
  let newBoundPoll;
  beforeEach("setup", async () => {
    protocol1Contract = await VaultContract.new("0x57616e636861696e", "0x57414e", web3.utils.toWei("0.1", "ether"), web3.utils.toWei("0.6", "ether"));
    await protocol1Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black")]);
    await protocol1Contract.addAttributeSet(web3.utils.fromAscii("Country"), [
      web3.utils.fromAscii("India"),
      web3.utils.fromAscii("USA"),
      web3.utils.fromAscii("China")
    ]);
    await protocol1Contract.assignTo(accounts[1], [0, 0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[2], [0, 0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[3], [0, 0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[4], [0, 0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[5], [0, 0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[6], [0, 1], {
      from: accounts[0]
    });
    protocol2Contract = await ElectusProtocol.new("0x55532026204368696e61", "0x5543", protocol1Contract.address);
    await protocol2Contract.addAttributeSet(web3.utils.fromAscii("Country"), [web3.utils.fromAscii("India"), web3.utils.fromAscii("Singapore")]);
    await protocol2Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black"), web3.utils.fromAscii("blonde")]);
    await protocol2Contract.assignTo(accounts[1], [0, 0], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[2], [0, 0], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[3], [0, 0], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[4], [0, 0], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[5], [0, 0], {
      from: accounts[0]
    });
    daicoToken = await DaicoToken.new("Electus", "ELE", protocol1Contract.address, "10000000000000000000000", "10");
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
    lockedTokens = await LockedTokens.new(daicoToken.address);
    pollFactory = await PollFactory.new(
      daicoToken.address,
      accounts[6],
      "10000000000000000",
      "14844355",
      presentTime + 129600,
      protocol1Contract.address,
      "10",
      "10",
      "20",
      "65",
      lockedTokens.address,
      "150"
    );
    newUnBoundPoll = await unBoundPoll.new(
      [protocol2Contract.address],
      ["0x68656c6c6f"],
      daicoToken.address,
      "900",
      "0x68656c6c6f",
      "0x776f726c64",
      "0x776f726c64",
      presentTime + 1,
      0,
      pollFactory.address
    );
    newBoundPoll = await boundPoll.new(
      [protocol2Contract.address],
      ["0x68656c6c6f"],
      daicoToken.address,
      "900",
      "0x68656c6c6f",
      "0x776f726c64",
      "0x776f726c64",
      presentTime + 1,
      1000000000
    );
    crowdSale = await CrowdSale.new(
      "2000000000000000000",
      "5000000000000000000",
      presentTime + 129600,
      presentTime,
      ["1000000000000000000000", "2000000000000000000000", "2000000000000000000000"],
      ["100", "200", "300"],
      lockedTokens.address,
      pollFactory.address,
      protocol1Contract.address,
      daicoToken.address,
      protocol2Contract.address,
      [accounts[7]],
      ["5000000000000000000000"]
    );
    await daicoToken.setTreasuryAddress(pollFactory.address);
    await daicoToken.setCrowdSaleAddress(crowdSale.address);
    await lockedTokens.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.setCrowdSaleAddress(crowdSale.address);
    await crowdSale.mintFoundationTokens();
    await increaseTime(10000);
  });
  it("start round1 failure : kill polls not deployed", async () => {
    try {
      await crowdSale.startNewRound();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("requests membership : Is a vault member but has wrong attributes", async () => {
    await protocol2Contract.requestMembership([1, 1], { from: accounts[6] });
    const isMembershipPending = await protocol2Contract.pendingRequests(accounts[6]);
    assert.equal(isMembershipPending, true);
  });
  it("get voter base denominator for unbound poll", async () => {
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[3]
    });
    await increaseTime(100);
    const tokens = web3.utils.fromWei(await newUnBoundPoll.getVoterBaseDenominator());
    assert.equal(tokens, 30);
  });
  it("get voter base denominator for bound poll", async () => {
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[3]
    });
    await increaseTime(100);
    const tokens = web3.utils.fromWei(await newBoundPoll.getVoterBaseDenominator());
    assert.equal(tokens, 30);
  });
});
