var ElectusProtocol = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");

module.exports = async function(deployer, network, accounts) {
  //   let protocol1Contract;
  //   let protocol2Contract;
  //   let daicoToken;
  //   let lockedTokens;
  //   let pollFactory;
  //   let crowdSale;
  //   let presentTime;
  //   protocol1Contract = await ElectusProtocol.new("0x57616e636861696e", "0x57414e");
  //   await protocol1Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black")]);
  //   await protocol1Contract.assignTo(accounts[1], [0], {
  //     from: accounts[0]
  //   });
  //   console.log("Vault Contract: ", protocol1Contract.address);
  //   await protocol1Contract.assignTo(accounts[2], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol1Contract.assignTo(accounts[3], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol1Contract.assignTo(accounts[4], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol1Contract.assignTo(accounts[5], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol1Contract.assignTo(accounts[6], [0], {
  //     from: accounts[0]
  //   });
  //   protocol2Contract = await ElectusProtocol.new("0x55532026204368696e61", "0x5543");
  //   await protocol2Contract.addAttributeSet(web3.utils.fromAscii("hair"), [web3.utils.fromAscii("black")]);
  //   await protocol2Contract.assignTo(accounts[1], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol2Contract.assignTo(accounts[2], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol2Contract.assignTo(accounts[3], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol2Contract.assignTo(accounts[4], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol2Contract.assignTo(accounts[5], [0], {
  //     from: accounts[0]
  //   });
  //   await protocol1Contract.assignTo(accounts[7], [0], {
  //     from: accounts[0]
  //   });
  //   console.log("Membership Contract: ", protocol2Contract.address);
  //   daicoToken = await DaicoToken.new("Electus", "ELE", protocol1Contract.address, "10000000000000000000000");
  //   console.log("Daico Token Contract: ", daicoToken.address);
  //   lockedTokens = await LockedTokens.new(daicoToken.address);
  //   console.log("Locked Token Contract: ", lockedTokens.address);
  //   presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
  //   pollFactory = await PollFactory.new(
  //     daicoToken.address,
  //     accounts[6],
  //     "1000000000000000000",
  //     presentTime + 12960,
  //     protocol2Contract.address,
  //     "10",
  //     "80",
  //     "20",
  //     "65",
  //     lockedTokens.address
  //   );
  //   console.log("Poll Factory Contract: ", pollFactory.address);
  //   crowdSale = await CrowdSale.new(
  //     "2000000000000000000",
  //     "5000000000000000000",
  //     presentTime + 12960,
  //     ["1000000000000000000000", "2000000000000000000000", "2000000000000000000000"],
  //     ["100", "200", "200"],
  //     lockedTokens.address,
  //     pollFactory.address,
  //     protocol1Contract.address,
  //     daicoToken.address,
  //     protocol2Contract.address,
  //     [accounts[7]],
  //     ["5000000000000000000000"]
  //   );
  //   console.log("Crowdsale Contract: ", crowdSale.address);
  //   await daicoToken.setTreasuryAddress(pollFactory.address);
  //   await daicoToken.setCrowdSaleAddress(crowdSale.address);
  //   await lockedTokens.setCrowdSaleAddress(crowdSale.address);
  //   await pollFactory.setCrowdSaleAddress(crowdSale.address);
  //   await pollFactory.createKillPolls();
  //   await pollFactory.createRemainingKillPolls();
  //   await crowdSale.mintFoundationTokens();
};
