var ProtocolContract = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
// execution: truffle exec .\scripts\deployVault.js --network development
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
    // const network = await web3.eth.net.getNetworkType();
    // const stringName = "Electus";
    // const stringSymbol = "ELE";
    // const totalMintableSupply = "1000000000000000000000000000"; // 1 billion
    // const name = web3.utils.fromAscii(stringName);
    // const symbol = web3.utils.fromAscii(stringSymbol);
    const vaultAddress = "0xAf32C5B541A5F62479Ad53531CE1a5Dbe4A73A5B";
    const teamAddress = accounts[6];
    const initialFundRelease = web3.utils.toWei("0.5", "ether");
    const initialTap = "385802469136"; // wei/sec check this number (1 eth/month)
    presentTime = (await web3.eth.getBlock(await web3.eth.getBlockNumber()))
      .timestamp;
    const r1EndTime = presentTime + 3600 * 2;
    const capPercent = "10";
    const killAcceptancePercent = "80";
    const xfrRejectionPercent = "20";
    const tapAcceptancePercent = "65";
    const tapIncrementFactor = "150";
    const etherMinContrib = web3.utils.toWei("0.01", "ether");
    const etherMaxContrib = web3.utils.toWei("1", "ether");
    const tokenCounts = [
      "125000000000000000000000000",
      "187500000000000000000000000",
      "187500000000000000000000000"
    ];
    const tokenRates = ["125000000", "62500000", "31250000"];
    const foundationAddresses = [accounts[7], accounts[8], accounts[9]];
    const foundationAmounts = [
      "100000000000000000000000000",
      "200000000000000000000000000",
      "200000000000000000000000000"
    ];
    // deploy
    // membershipContract = await ProtocolContract.new(name, symbol, vaultAddress);
    // console.log("Membership Contract: ", membershipContract.address);
    // console.log("Deploy Phase Completed");
    // // perform actions - Fake Assignments
    // for (let index = 0; index < 16; index++) {
    //   await membershipContract.assignTo(accounts[index + 1], [], {
    //     from: accounts[0]
    //   });
    // }

    membershipContract = await ProtocolContract.at(
      "0x5B3bb9933845b6521EFe070B6a73eb4DA2A453fB"
    );

    // daicoToken = await DaicoToken.new(stringName, stringSymbol, vaultAddress, totalMintableSupply, capPercent);
    daicoToken = await DaicoToken.at(
      "0x546a2fc5dEF1b9121C9C08B4e01377CD31Ca1571"
    );
    console.log("Daico Token Contract: ", daicoToken.address);
    // lockedTokens = await LockedTokens.new(daicoToken.address);
    lockedTokens = await LockedTokens.at(
      "0xE6e8E11C4Df582B5da77E1ad1EDB79BB368F6Ff8"
    );
    console.log("Locked Token Contract: ", lockedTokens.address);
    pollFactory = await PollFactory.new(
      daicoToken.address,
      teamAddress,
      initialFundRelease,
      initialTap,
      r1EndTime,
      membershipContract.address,
      capPercent,
      killAcceptancePercent,
      xfrRejectionPercent,
      tapAcceptancePercent,
      lockedTokens.address,
      tapIncrementFactor
    );
    console.log("Poll Factory Contract: ", pollFactory.address);
    crowdSale = await CrowdSale.new(
      etherMinContrib,
      etherMaxContrib,
      r1EndTime,
      presentTime,
      tokenCounts,
      tokenRates,
      lockedTokens.address,
      pollFactory.address,
      vaultAddress,
      daicoToken.address,
      membershipContract.address,
      foundationAddresses,
      foundationAmounts
    );
    console.log("Crowdsale Contract: ", crowdSale.address);
    await daicoToken.setTreasuryAddress(pollFactory.address);
    await daicoToken.setCrowdSaleAddress(crowdSale.address);
    await lockedTokens.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.setCrowdSaleAddress(crowdSale.address);
    await pollFactory.createKillPolls();
    await pollFactory.createRemainingKillPolls();
    await crowdSale.mintFoundationTokens();
    console.log("Deployment done");
    // // starts round 1
    // await crowdSale.startNewRound();
    // // buys crowdsale r1
    // await crowdSale.sendTransaction({
    //   value: await web3.utils.toWei("2", "ether").toString(),
    //   from: accounts[6]
    // });
    callback(membershipContract.address);
  } catch (error) {
    callback(error);
  }
}

module.exports = DeployMembership;
