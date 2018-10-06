var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
contract("Vault Test", function(accounts) {
  let protocol1Contract;
  let protocol2Contract;
  let daicoToken;
  let lockedTokens;
  let pollFactory;
  let crowdSale;
  let presentTime;
  beforeEach("setup", async () => {
    protocol1Contract = await ElectusProtocol.new("0x57616e636861696e", "0x57414e");
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
    protocol2Contract = await ElectusProtocol.new("0x55532026204368696e61", "0x5543");
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
    daicoToken = await DaicoToken.new("Electus", "ELE", protocol1Contract.address, "10000000000000000000000");
    lockedTokens = await LockedTokens.new(daicoToken.address);
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
    pollFactory = await PollFactory.new(
      daicoToken.address,
      accounts[6],
      "1000000000000000000",
      "14844355",
      presentTime + 129600,
      protocol2Contract.address,
      "10",
      "10",
      "20",
      "65",
      lockedTokens.address,
      "150"
    );
    crowdSale = await CrowdSale.new(
      "2000000000000000000",
      "5000000000000000000",
      presentTime + 129600,
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
  });
  it("start round1 failure : kill polls not deployed", async () => {
    try {
      await crowdSale.startNewRound();
    } catch (err) {
      assert.exists(err);
    }
  });
});
