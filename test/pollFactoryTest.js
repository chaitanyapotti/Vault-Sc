var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
const increaseTime = require("./utils/increaseTime");
const truffleAssert = require("truffle-assertions");
var boundPoll = artifacts.require("./BoundPoll.sol");
var unBoundPoll = artifacts.require("./UnBoundPoll.sol");
var VaultContract = artifacts.require("./Vault.sol");

contract("Poll Factory Test", function(accounts) {
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
    await protocol1Contract.assignTo(accounts[1], [0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[2], [0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[3], [0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[4], [0], {
      from: accounts[0]
    });

    await protocol1Contract.assignTo(accounts[5], [0], {
      from: accounts[0]
    });

    await protocol1Contract.assignTo(accounts[6], [0], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[7], [0], {
      from: accounts[0]
    });

    await protocol1Contract.assignTo(accounts[8], [0], {
      from: accounts[0]
    });

    await protocol1Contract.assignTo(accounts[9], [0], {
      from: accounts[0]
    });

    protocol2Contract = await ElectusProtocol.new("0x55532026204368696e61", "0x5543", protocol1Contract.address);

    await protocol2Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black")]);

    await protocol2Contract.assignTo(accounts[1], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[2], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[3], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[4], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[5], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[6], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[7], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[8], [0], {
      from: accounts[0]
    });

    await protocol2Contract.assignTo(accounts[9], [0], {
      from: accounts[0]
    });

    daicoToken = await DaicoToken.new("Electus", "ELE", protocol1Contract.address, "10000000000000000000000", "900");

    lockedTokens = await LockedTokens.new(daicoToken.address);

    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
    pollFactory = await PollFactory.new(
      daicoToken.address,
      accounts[15],
      "10000000000000000",
      "14844355",
      presentTime + 12960,
      protocol1Contract.address,
      "900",
      "75",
      "35",
      "65",
      lockedTokens.address,
      "150"
    );
    newUnBoundPoll = await unBoundPoll.new(
      [protocol2Contract.address],
      ["0x68656c6c6f", "0x776f726c64"],
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
      ["0x68656c6c6f", "0x776f726c64"],
      daicoToken.address,
      "900",
      "0x68656c6c6f",
      "0x776f726c64",
      "0x776f726c64",
      presentTime + 1,
      1000000000
    );
    crowdSale = await CrowdSale.new(
      "1000000000000000000",
      "5000000000000000000",
      presentTime + 12960,
      presentTime,
      ["8100000000000000000000", "450000000000000000000", "450000000000000000000"],
      ["900", "200", "200"],
      lockedTokens.address,
      pollFactory.address,
      protocol1Contract.address,
      daicoToken.address,
      protocol2Contract.address,
      [accounts[13]],
      ["1000000000000000000000"]
    );
    await daicoToken.setTreasuryAddress(pollFactory.address);
    await daicoToken.setCrowdSaleAddress(crowdSale.address);
    await lockedTokens.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await crowdSale.mintFoundationTokens();
  });
  it("execute kill failure: current kill poll hasnt ended yet", async () => {
    try {
      await pollFactory.executeKill();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("execute kill failure: calls when governance is not in place", async () => {
    await increaseTime(1000000000);
    try {
      await pollFactory.executeKill();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("execute kill success ", async () => {
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[9]
    });
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await killPollInstance.vote(0, { from: accounts[2] });
    await killPollInstance.vote(0, { from: accounts[3] });
    await killPollInstance.vote(0, { from: accounts[4] });
    await killPollInstance.vote(0, { from: accounts[5] });
    await killPollInstance.vote(0, { from: accounts[6] });
    await killPollInstance.vote(0, { from: accounts[7] });
    await killPollInstance.vote(0, { from: accounts[8] });
    await killPollInstance.vote(0, { from: accounts[9] });
    await killPollInstance.getVoterBaseDenominator();
    await increaseTime(10000000);
    const result = await pollFactory.executeKill();
    const result1 = await pollFactory.refundByKill({ from: accounts[1] });
    truffleAssert.eventEmitted(result, "RefundStarted");
    truffleAssert.eventEmitted(result1, "RefundSent");
  });
  it("execute kill failure: returns false in can kill check", async () => {
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
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await increaseTime(10000000);
    const result = await pollFactory.canKill();
    assert.equal(web3.utils.toDecimal(result.code), 10);
    await pollFactory.executeKill();
    const currentkillPollIndex = await pollFactory.currentKillPollIndex();
    assert.equal(web3.utils.toDecimal(currentkillPollIndex), 1);
  });
  it("first with draw success", async () => {
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
    const result = await pollFactory.withdrawAmount("100");
    truffleAssert.eventEmitted(result, "Withdraw");
  });
  it("create tap increment poll: success", async () => {
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
    const result = await pollFactory.createTapIncrementPoll();
    truffleAssert.eventEmitted(result, "TapPollCreated");
  });
  it("create tap increment poll failure: tries to create tap poll when a tap exists already", async () => {
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
    const result = await pollFactory.createTapIncrementPoll();
    truffleAssert.eventEmitted(result, "TapPollCreated");
    try {
      await pollFactory.createTapIncrementPoll();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("increase tap failure", async () => {
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
    await pollFactory.createTapIncrementPoll();
    await increaseTime(1000);
    const tapPollAddress = await pollFactory.tapPoll();
    const tapPollInstance = await unBoundPoll.at(tapPollAddress);
    await tapPollInstance.vote(0, { from: accounts[1] });
    const result = await pollFactory.canIncreaseTap();
    assert.equal(web3.utils.toDecimal(result.code), 10);
  });
  it("can increase tap success ", async () => {
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[9]
    });
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await killPollInstance.vote(0, { from: accounts[2] });
    await killPollInstance.vote(0, { from: accounts[3] });
    await pollFactory.createTapIncrementPoll();
    await increaseTime(1000);
    const tapPollAddress = await pollFactory.tapPoll();
    const tapPollInstance = await unBoundPoll.at(tapPollAddress);
    await tapPollInstance.vote(0, { from: accounts[1] });
    await tapPollInstance.vote(0, { from: accounts[2] });
    await tapPollInstance.vote(0, { from: accounts[3] });
    await tapPollInstance.vote(0, { from: accounts[4] });
    await tapPollInstance.vote(0, { from: accounts[5] });
    await tapPollInstance.vote(0, { from: accounts[6] });
    await tapPollInstance.vote(0, { from: accounts[7] });
    await tapPollInstance.vote(0, { from: accounts[8] });
    const result = await pollFactory.increaseTap();
    truffleAssert.eventEmitted(result, "TapIncreased");
  });
  it("unbound poll ended and revoke ", async () => {
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[9]
    });
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await killPollInstance.vote(0, { from: accounts[2] });
    await killPollInstance.vote(0, { from: accounts[3] });
    await pollFactory.createTapIncrementPoll();
    await increaseTime(1000);
    const tapPollAddress = await pollFactory.tapPoll();
    const tapPollInstance = await unBoundPoll.at(tapPollAddress);
    await tapPollInstance.vote(0, { from: accounts[1] });
    await tapPollInstance.vote(0, { from: accounts[2] });
    await tapPollInstance.vote(0, { from: accounts[3] });
    await tapPollInstance.vote(0, { from: accounts[4] });
    await tapPollInstance.vote(0, { from: accounts[5] });
    await tapPollInstance.vote(0, { from: accounts[6] });
    await tapPollInstance.vote(0, { from: accounts[7] });
    await tapPollInstance.vote(0, { from: accounts[8] });
    const revokedResult = await tapPollInstance.revokeVote({ from: accounts[8] });
    truffleAssert.eventEmitted(revokedResult, "RevokedVote");
    const result = await pollFactory.increaseTap();
    truffleAssert.eventEmitted(result, "TapIncreased");
    await tapPollInstance.revokeVote({ from: accounts[7] });
  });
  it("createXfr success", async () => {
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
    const result = await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    truffleAssert.eventEmitted(result, "XfrPollCreated");
  });
  it("createXfr success failure: tries to create 3rd XFR", async () => {
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
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    try {
      await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    } catch (err) {
      assert.exists(err);
    }
  });
  it("createXfr success failure: Can't withdraw more than 10% of balance", async () => {
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
    try {
      await pollFactory.createXfr(await web3.utils.toWei("1", "ether"));
    } catch (err) {
      assert.exists(err);
    }
  });
  it("withdraw xfr amount success", async () => {
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
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await increaseTime(2764800);
    const withdraw = await pollFactory.withdrawXfrAmount();
    truffleAssert.eventEmitted(withdraw, "XfrWithdraw");
  });
  it("withdraw xfr amount failure : poll has not ended", async () => {
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
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    try {
      await pollFactory.withdrawXfrAmount();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("withdraw xfr amount failure : can kill is true so withdraw for xfr fails", async () => {
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[9]
    });
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await killPollInstance.vote(0, { from: accounts[2] });
    await killPollInstance.vote(0, { from: accounts[3] });
    await killPollInstance.vote(0, { from: accounts[4] });
    await killPollInstance.vote(0, { from: accounts[5] });
    await killPollInstance.vote(0, { from: accounts[6] });
    await killPollInstance.vote(0, { from: accounts[7] });
    await killPollInstance.vote(0, { from: accounts[8] });
    await killPollInstance.vote(0, { from: accounts[9] });
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await increaseTime(3000000);
    try {
      await pollFactory.withdrawXfrAmount();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("withdraw amount success", async () => {
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
    await increaseTime(6936580000);
    const result = await pollFactory.withdrawAmount("10000000000000000");
    truffleAssert.eventEmitted(result, "Withdraw");
  });
  it("withdraw amount failure : can withdraw returns false", async () => {
    await increaseTime(10000);
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("1", "ether").toString(),
      from: accounts[9]
    });
    const killPollAddress = await pollFactory.currentKillPoll();
    const killPollInstance = await boundPoll.at(killPollAddress);
    await increaseTime(13500);
    await killPollInstance.vote(0, { from: accounts[1] });
    await killPollInstance.vote(0, { from: accounts[2] });
    await killPollInstance.vote(0, { from: accounts[3] });
    await killPollInstance.vote(0, { from: accounts[4] });
    await killPollInstance.vote(0, { from: accounts[5] });
    await killPollInstance.vote(0, { from: accounts[6] });
    await killPollInstance.vote(0, { from: accounts[7] });
    await killPollInstance.vote(0, { from: accounts[8] });
    await killPollInstance.vote(0, { from: accounts[9] });
    await increaseTime(693658000000);
    try {
      await pollFactory.withdrawAmount("10000000000000000");
    } catch (err) {
      assert.exists(err);
    }
  });
  it("get voter base denominator for unbound poll", async () => {
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
    await newUnBoundPoll.getVoterBaseDenominator();
  });
  it("get voter base denominator for bound poll", async () => {
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
    await newBoundPoll.getVoterBaseDenominator();
  });
  it("createXfr success: creates 3rd and 4th XFR after a long time", async () => {
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
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.8", "ether"));
    await increaseTime(86400 * 35);
    await pollFactory.createXfr(await web3.utils.toWei("0.9", "ether"));
    await pollFactory.createXfr(await web3.utils.toWei("0.6", "ether"));
    const pollData = await pollFactory.xfrPollData(0);
    const pollData2 = await pollFactory.xfrPollData(1);
    const amount = pollData.amountRequested;
    const amount2 = pollData2.amountRequested;
    assert.equal(web3.utils.fromWei(amount), 0.9);
    assert.equal(web3.utils.fromWei(amount2), 0.6);
  });
});
