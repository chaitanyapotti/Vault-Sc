var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
const increaseTime = require("./utils/increaseTime");
const truffleAssert = require("truffle-assertions");
var boundPoll = artifacts.require("./BoundPoll.sol");
var VaultContract = artifacts.require("./Vault.sol");

contract("Crowdsale Test", function(accounts) {
  let protocol1Contract;
  let protocol2Contract;
  let daicoToken;
  let lockedTokens;
  let pollFactory;
  let crowdSale;
  let presentTime;
  beforeEach("setup", async () => {
    protocol1Contract = await VaultContract.new("0x57616e636861696e", "0x57414e", web3.utils.toWei("0.1", "ether"), web3.utils.toWei("0.6", "ether"));
    await protocol1Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black")]);
    await protocol1Contract.addAttributeSet(web3.utils.fromAscii("Country"), [web3.utils.fromAscii("India"), web3.utils.fromAscii("Singapore")]);
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
    await protocol1Contract.assignTo(accounts[17], [0, 0], {
      from: accounts[0]
    });
    protocol2Contract = await ElectusProtocol.new("0x55532026204368696e61", "0x5543", protocol1Contract.address);
    await protocol2Contract.assignTo(accounts[1], [], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[2], [], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[3], [], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[4], [], {
      from: accounts[0]
    });
    await protocol2Contract.assignTo(accounts[5], [], {
      from: accounts[0]
    });
    await protocol1Contract.assignTo(accounts[7], [], {
      from: accounts[0]
    });
    daicoToken = await DaicoToken.new("Electus", "ELE", protocol1Contract.address, "10000000000000000000000", "10");
    lockedTokens = await LockedTokens.new(daicoToken.address);
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
    pollFactory = await PollFactory.new(
      daicoToken.address,
      accounts[6],
      "790000000000000000",
      "14844355",
      presentTime + 12960,
      protocol1Contract.address,
      "10",
      "80",
      "20",
      "65",
      lockedTokens.address,
      "150"
    );
    crowdSale = await CrowdSale.new(
      "2000000000000000000",
      "5000000000000000000",
      presentTime + 12960,
      presentTime,
      ["1000000000000000000000", "2000000000000000000000", "2000000000000000000000"],
      ["100", "200", "200"],
      lockedTokens.address,
      pollFactory.address,
      protocol1Contract.address,
      daicoToken.address,
      protocol2Contract.address,
      [accounts[18]],
      ["5000000000000000000000"]
    );
    await daicoToken.setTreasuryAddress(pollFactory.address);
    await daicoToken.setCrowdSaleAddress(crowdSale.address);
    await lockedTokens.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await crowdSale.mintFoundationTokens();
    await increaseTime(10000);
  });
  // it("request membership", async () => {
  //   const result = await protocol2Contract.requestMembership([], {
  //     from: accounts[17]
  //   });
  //   truffleAssert.eventEmitted(result, "RequestedMembership");
  //   truffleAssert.eventEmitted(result, "Assigned");
  // });
  // it("request vault membership", async () => {
  //   const result = await protocol1Contract.requestMembership([0, 0], {
  //     from: accounts[13],
  //     value: await web3.utils.toWei("1", "ether").toString()
  //   });
  //   truffleAssert.eventEmitted(result, "RequestedMembership");
  // });
  // it("request vault membership - case 2", async () => {
  //   const result = await protocol1Contract.requestMembership([0, 1], {
  //     from: accounts[13],
  //     value: await web3.utils.toWei("1", "ether").toString()
  //   });
  //   truffleAssert.eventEmitted(result, "RequestedMembership");
  // });
  // it("modify fee", async () => {
  //   await protocol1Contract.modifyFee(await web3.utils.toWei("0.2", "ether").toString());
  // });
  // it("modify issuer fee", async () => {
  //   await protocol1Contract.modifyIssuerFee(await web3.utils.toWei("0.7", "ether").toString());
  // });
  // it("start round 1 : success", async () => {
  //   await crowdSale.startNewRound();
  //   const r1EndTime = await crowdSale.currentRoundEndTime();
  //   assert.equal(web3.utils.toDecimal(r1EndTime), presentTime + 12960);
  // });
  // it("start round1 failure : current time ahead of end time", async () => {
  //   await increaseTime(1000000000);
  //   try {
  //     await crowdSale.startNewRound();
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution failure: Has no vault membership", async () => {
  //   await crowdSale.startNewRound();
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("2", "ether").toString(),
  //       from: accounts[6]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution failure: Has no daico membership", async () => {
  //   await crowdSale.startNewRound();
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("2", "ether").toString(),
  //       from: accounts[7]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution failure: min ether contribution", async () => {
  //   await crowdSale.startNewRound();
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("1", "ether").toString(),
  //       from: accounts[1]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution failure: max ether contribution", async () => {
  //   await crowdSale.startNewRound();
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("6", "ether").toString(),
  //       from: accounts[1]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution failure: tries to contribute after first round has passed", async () => {
  //   await crowdSale.startNewRound();
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("2", "ether").toString(),
  //       from: accounts[1]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution success: sends valid ether", async () => {
  //   await crowdSale.startNewRound();
  //   const result = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   truffleAssert.eventEmitted(result, "LogContribution");
  // });
  // it("processContribution failure: Total ether sent by single member exceed max contribution", async () => {
  //   await crowdSale.startNewRound();
  //   const result = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   truffleAssert.eventEmitted(result, "LogContribution");
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("3", "ether").toString(),
  //       from: accounts[1]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("processContribution & round finalised success: 3rd member sends excess ether", async () => {
  //   await crowdSale.startNewRound();
  //   const result = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   const result1 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("4.5", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   const result2 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   truffleAssert.eventEmitted(result, "LogContribution");
  //   truffleAssert.eventEmitted(result1, "LogContribution");
  //   truffleAssert.eventEmitted(result2, "LogContribution");
  // });
  // it("wei left revert ether success: memeber sends extra ether in round 2", async () => {
  //   await crowdSale.startNewRound();
  //   const result = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   const result1 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("4.5", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   const result2 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await increaseTime(100000000000);
  //   await crowdSale.startNewRound();
  //   const result3 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   const result4 = await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   truffleAssert.eventEmitted(result, "LogContribution");
  //   truffleAssert.eventEmitted(result1, "LogContribution");
  //   truffleAssert.eventEmitted(result2, "LogContribution");
  //   truffleAssert.eventEmitted(result3, "LogContribution");
  //   truffleAssert.eventEmitted(result4, "LogContribution");
  // });
  // it("finalize round one: all tokens are not sold ", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await increaseTime(100000000000);
  //   await crowdSale.finalizeRoundOne();
  //   const refund = await pollFactory.refundBySoftcapFail({ from: accounts[1] });
  //   truffleAssert.eventEmitted(refund, "RefundSent");
  // });
  // // it("finalize round one: all tokens are not sold and refund by owner", async () => {
  // //   await crowdSale.startNewRound();
  // //   await crowdSale.sendTransaction({
  // //     value: await web3.utils.toWei("5", "ether").toString(),
  // //     from: accounts[1]
  // //   });
  // //   await increaseTime(100000000000);
  // //   await crowdSale.finalizeRoundOne();
  // //   const refund = await pollFactory.forceRefundBySoftcapFail(accounts[1]);
  // //   truffleAssert.eventEmitted(refund, "RefundSent");
  // // });
  // it("start new round failure : tries to start round2 after crowd sale is killed", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await increaseTime(100000000000);
  //   await crowdSale.finalizeRoundOne();
  //   await pollFactory.refundBySoftcapFail({ from: accounts[1] });
  //   await increaseTime(100000);
  //   try {
  //     await crowdSale.startNewRound();
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("start new round failure : tries to start round2 before 24 hours (overflow of tokens)", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2.5", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   try {
  //     await crowdSale.startNewRound();
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("start new round failure : tries to start round2 before 24 hours (no overflows of tokens)", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   try {
  //     await crowdSale.startNewRound();
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("start round 2 :success", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000000);
  //   await crowdSale.startNewRound();
  // });
  // it("process contribution success in round2(all tokens sold)", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  // });
  // it("process contribution success in round2(overshoot)", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("4", "ether").toString(),
  //     from: accounts[3]
  //   });
  // });
  // it("process contribution failure tries to contribute after all round2 tokens are sold", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("4", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("2", "ether").toString(),
  //       from: accounts[4]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("start round 3: success", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  // });
  // it("start round 3 failure: tries to start before 24 hours", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(10000);
  //   try {
  //     await crowdSale.startNewRound();
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("round 3 ends: all tokens are sold", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  // });
  // it("process contribution failure: tries to contribute after round3 ends", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   try {
  //     await crowdSale.sendTransaction({
  //       value: await web3.utils.toWei("2", "ether").toString(),
  //       from: accounts[4]
  //     });
  //   } catch (err) {
  //     assert.exists(err);
  //   }
  // });
  // it("round 3 tokens overshoot success: refunds weileft to the member", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await increaseTime(100000);
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[4]
  //   });
  // });
  // it("releases tokens success", async () => {
  //   await increaseTime(41536000);
  //   const result = await lockedTokens.releaseTokens({ from: accounts[18] });
  //   truffleAssert.eventEmitted(result, "TokensUnlocked");
  // });
  // it("burn tokens", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.burn(10000000, { from: accounts[3] });
  // });
  // it("transfers tokens", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[2], 10000000, { from: accounts[3] });
  // });
  // it("transfers tokens using transfer from method", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.approve(accounts[2], 10000000, { from: accounts[3] });
  //   await daicoToken.transferFrom(accounts[3], accounts[2], 10000000, {
  //     from: accounts[2]
  //   });
  // });
  // it("transfers tokens to a person who is not a vault member", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[12], "10000000", { from: accounts[3] });
  // });
  // it("a daico member revokes his vault membership and transfers tokens to another daico member", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await protocol2Contract.forfeitMembership({
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[2], 10000000, { from: accounts[3] });
  // });
  // it("unfreeze account", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   const killPollAddress = await pollFactory.currentKillPoll();
  //   const killPollInstance = await boundPoll.at(killPollAddress);
  //   await increaseTime(13500);
  //   await killPollInstance.vote(0, { from: accounts[1] });
  //   await increaseTime(8000000);
  //   await killPollInstance.unFreezeTokens({ from: accounts[1] });
  // });
  // it("a person who is not a vault member transfers tokens to a person who is both vault & daico member", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await protocol1Contract.forfeitMembership({
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[2], "10000000", { from: accounts[3] });
  // });
  // it("a person who is not a vault member transfers tokens to a person who is both vault, daico member & balance less than cap token amount", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[2], "195000000000000000000", { from: accounts[3] });
  //   await protocol1Contract.forfeitMembership({
  //     from: accounts[2]
  //   });
  //   await daicoToken.transfer(accounts[3], "10000", { from: accounts[2] });
  // });
  // it("a person who is a vault member and has balance less than cap token amount transfers tokens", async () => {
  //   await crowdSale.startNewRound();
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("5", "ether").toString(),
  //     from: accounts[1]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("3", "ether").toString(),
  //     from: accounts[2]
  //   });
  //   await crowdSale.sendTransaction({
  //     value: await web3.utils.toWei("2", "ether").toString(),
  //     from: accounts[3]
  //   });
  //   await daicoToken.transfer(accounts[2], "195000000000000000000", { from: accounts[3] });
  //   await daicoToken.transfer(accounts[2], "10000", { from: accounts[3] });
  // });
  it("wei left revert success: memeber sends extra ether in round 3", async () => {
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
    await increaseTime(100000000000);
    await crowdSale.startNewRound();
    const result3 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    const result4 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[2]
    });
    await increaseTime(100000000000);
    await crowdSale.startNewRound();
    const result5 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("5", "ether").toString(),
      from: accounts[1]
    });
    const result6 = await crowdSale.sendTransaction({
      value: await web3.utils.toWei("7", "ether").toString(),
      from: accounts[2]
    });
    truffleAssert.eventEmitted(result, "LogContribution");
    truffleAssert.eventEmitted(result1, "LogContribution");
    truffleAssert.eventEmitted(result2, "LogContribution");
    truffleAssert.eventEmitted(result3, "LogContribution");
    truffleAssert.eventEmitted(result4, "LogContribution");
    truffleAssert.eventEmitted(result5, "LogContribution");
    truffleAssert.eventEmitted(result6, "LogContribution");
  });
});
