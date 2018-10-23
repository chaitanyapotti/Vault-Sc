var ProtocolContract = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");

async function DeployMembership(callback) {
  try {
    let membershipContract;
    let daicoToken;
    let lockedTokens;
    let pollFactory;
    let crowdSale;
    let presentTime;
    // setup
    const accounts = await web3.eth.getAccounts();
    const network = await web3.eth.net.getNetworkType();
    const stringName = "Electus";
    const stringSymbol = "ELE";
    const totalMintableSupply = "1000000000000000000000000000"; // 1 billion
    const name = await web3.utils.fromAscii(stringName);
    const symbol = await web3.utils.fromAscii(stringSymbol);
    const vaultAddress = "0xAf32C5B541A5F62479Ad53531CE1a5Dbe4A73A5B";
    const teamAddress = accounts[6];
    const initialFundRelease = web3.utils.toWei("0.09", "ether");
    const initialTap = "385802469136"; // wei/sec check this number (1 eth/month)
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber())).timestamp;
    const r1EndTime = presentTime + 3600 * 2;
    const capPercent = "900"; // 9%
    const killAcceptancePercent = "80";
    const xfrRejectionPercent = "20";
    const tapAcceptancePercent = "65";
    const tapIncrementFactor = "150";
    const etherMinContrib = await web3.utils.toWei("0.01", "ether");
    const etherMaxContrib = await web3.utils.toWei("1", "ether");
    const tokenCounts = ["125000000000000000000000000", "187500000000000000000000000", "187500000000000000000000000"];
    const tokenRates = ["125000000", "62500000", "31250000"];
    const foundationAddresses = [accounts[7], accounts[8], accounts[9]];
    const foundationAmounts = ["100000000000000000000000000", "200000000000000000000000000", "200000000000000000000000000"];
    const membershipAddress = "0x24bf3fF6Ba687cec7c3226cBdCde00ccb90EE257";
    const daicoTokenAddress = "0xC78c718bB402e5ba79282A6Dfb39C63f72d986f3";
    const lockedTokensAddress = "0x6DeCE9368e2821aa51FC606B1A9d491dA0976CbF";
    const pollFactoryAddress = "0x7C2eB024a140D78a77f7a0899F04322695B6bB19";
    const crowdSaleAddress = "0x1B6eCf00604845862EEd79A2298Fd3B05930AAf1";
    // deploy
    membershipContract = await ProtocolContract.at(membershipAddress);

    daicoToken = await DaicoToken.at(daicoTokenAddress);
    lockedTokens = await LockedTokens.at(lockedTokensAddress);
    pollFactory = await PollFactory.at(pollFactoryAddress);
    crowdSale = await CrowdSale.at(crowdSaleAddress);
    console.log("Deployment done");
    await crowdSale.finalizeRoundOne();
    // starts round 1
    // await crowdSale.startNewRound();
    // buys crowdsale r1
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.25", "ether").toString(),
    //   from: accounts[2]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.15", "ether").toString(),
    //   from: accounts[3]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.1", "ether").toString(),
    //   from: accounts[4]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.05", "ether").toString(),
    //   from: accounts[5]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.05", "ether").toString(),
    //   from: accounts[6]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.01", "ether").toString(),
    //   from: accounts[7]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.03", "ether").toString(),
    //   from: accounts[8]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.02", "ether").toString(),
    //   from: accounts[9]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.04", "ether").toString(),
    //   from: accounts[10]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.05", "ether").toString(),
    //   from: accounts[11]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.05", "ether").toString(),
    //   from: accounts[12]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.08", "ether").toString(),
    //   from: accounts[13]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.02", "ether").toString(),
    //   from: accounts[14]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.05", "ether").toString(),
    //   from: accounts[15]
    // });
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("0.06", "ether").toString(),
    //   from: accounts[16]
    // });
    callback(membershipContract.address);
  } catch (error) {
    callback(error);
  }
}

module.exports = DeployMembership;
