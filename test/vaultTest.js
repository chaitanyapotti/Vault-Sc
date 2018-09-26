var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
const increaseTime = require("./utils/increaseTime");
const truffleAssert = require("truffle-assertions");

contract("Vault Test", function(accounts) {
  let protocol1Contract;
  let protocol2Contract;
  let daicoToken;
  let lockedTokens;
  let pollFactory;
  let crowdSale;
  let presentTime;
  beforeEach("setup", async () => {
    protocol1Contract = await ElectusProtocol.new(
      "0x57616e636861696e",
      "0x57414e"
    );
    await protocol1Contract.addAttributeSet(web3.utils.fromAscii("hair"), [
      web3.utils.fromAscii("black")
    ]);
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
    protocol2Contract = await ElectusProtocol.new(
      "0x55532026204368696e61",
      "0x5543"
    );
    await protocol2Contract.addAttributeSet(web3.utils.fromAscii("hair"), [
      web3.utils.fromAscii("black")
    ]);
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
    await protocol1Contract.assignTo(accounts[7], [0], {
      from: accounts[0]
    });
    daicoToken = await DaicoToken.new(
      "Electus",
      "ELE",
      protocol1Contract.address,
      "10000000000000000000000"
    );
    lockedTokens = await LockedTokens.new(daicoToken.address);
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber()))
      .timestamp;
    let firstKillPollStartDate = presentTime + 55879;
    pollFactory = await PollFactory.new(
      daicoToken.address,
      accounts[6],
      "1000000000000000000",
      [
        firstKillPollStartDate,
        (firstKillPollStartDate + 864000).toString(),
        (firstKillPollStartDate + 1728000).toString(),
        (firstKillPollStartDate + 2592000).toString(),
        (firstKillPollStartDate + 3456000).toString(),
        (firstKillPollStartDate + 4320000).toString(),
        (firstKillPollStartDate + 5184000).toString(),
        (firstKillPollStartDate + 6048000).toString()
      ],
      protocol2Contract.address,
      "10",
      "10",
      "20",
      "65",
      lockedTokens.address
    );
    crowdSale = await CrowdSale.new(
      "2000000000000000000",
      "5000000000000000000",
      presentTime + 129600,
      [
        "1000000000000000000000",
        "2000000000000000000000",
        "2000000000000000000000"
      ],
      ["100", "200", "200"],
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
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await crowdSale.mintFoundationTokens();
  });
  it("start round 1 : success", async () => {
    await crowdSale.startNewRound();
    const r1EndTime = await crowdSale.currentRoundEndTime();
    assert.equal(web3.utils.toDecimal(r1EndTime), presentTime + 129600);
  });
  it("start round1 failure : current time ahead of end time", async () => {
    await increaseTime(1000000000);
    try {
      await crowdSale.startNewRound();
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution failure: Has no vault membership", async () => {
    await crowdSale.startNewRound();
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("2", "ether").toString(),
        from: accounts[6]
      });
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution failure: Has no daico membership", async () => {
    await crowdSale.startNewRound();
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("2", "ether").toString(),
        from: accounts[7]
      });
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution failure: min ether contribution", async () => {
    await crowdSale.startNewRound();
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("1", "ether").toString(),
        from: accounts[1]
      });
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution failure: max ether contribution", async () => {
    await crowdSale.startNewRound();
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("6", "ether").toString(),
        from: accounts[1]
      });
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution failure: tries to contribute after first round has passed", async () => {
    await crowdSale.startNewRound();
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("2", "ether").toString(),
        from: accounts[1]
      });
    } catch (err) {
      console.log(err.message);
      assert.exists(err);
    }
  });
  it("processContribution success: sends valid ether", async () => {
    await crowdSale.startNewRound();
    const result = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[1]
    });
    truffleAssert.eventEmitted(result, "LogContribution");
  });
  it("processContribution failure: Total ether sent by single member exceed max contribution", async () => {
    await crowdSale.startNewRound();
    const result = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[1]
    });
    truffleAssert.eventEmitted(result, "LogContribution");
    try {
      await crowdSale.sendTransaction({
        value: await web3.utils.toWei("3", "ether").toString(),
        from: accounts[1]
      });
    } catch (err) {
      assert.exists(err);
    }
  });
  it("processContribution & round finalised success: 3rd member sends excess ether", async () => {
    await crowdSale.startNewRound();
    const result = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[3]
    });
    const result1 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("4.5", "ether").toString(),
      from: accounts[2]
    });
    const result2 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("2", "ether").toString(),
      from: accounts[1]
    });
    truffleAssert.eventEmitted(result, "LogContribution");
    truffleAssert.eventEmitted(result1, "LogContribution");
    truffleAssert.eventEmitted(result2, "LogContribution");
  });
  it("finalize round one: all tokens are not sold ", async () => {
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    await increaseTime(100000000000);
    await crowdSale.finalizeRoundOne();
    await pollFactory.refundBySoftcapFail({from: accounts[1]})
  });
  it("start new round failure : tries to start round2 after crowd sale is killed", async () => {
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    await increaseTime(100000000000);
    await crowdSale.finalizeRoundOne();
    await pollFactory.refundBySoftcapFail({ from: accounts[1] });
    await increaseTime(100000);
    try {
      await crowdSale.startNewRound();
    }
    catch(err){
      assert.exists(err);
    }
  });
  it("start new round failure : tries to start round2 before 24 hours (overflow of tokens)", async () => {
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("4.5", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("2", "ether").toString(),
      from: accounts[3]
    });
    try {
      await crowdSale.startNewRound();
    }
    catch(err){
      assert.exists(err);
    }
  });
  it("start new round failure : tries to start round2 before 24 hours (no overflows of tokens)", async () => {
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("2", "ether").toString(),
      from: accounts[3]
    });
    try {
      await crowdSale.startNewRound();
    }
    catch(err){
      assert.exists(err);
    }
  });
  it("start round 2 :success", async () => {
    await crowdSale.startNewRound();
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("3", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("2", "ether").toString(),
      from: accounts[3]
    });
    await increaseTime(100000000);
    await crowdSale.startNewRound();
  });
});
