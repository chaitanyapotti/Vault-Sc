var ProtocolContract = artifacts.require("./Protocol.sol");
var DaicoToken = artifacts.require("./DaicoToken.sol");
var LockedTokens = artifacts.require("./LockedTokens.sol");
var PollFactory = artifacts.require("./PollFactory.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");
// var VaultContract = artifacts.require("./Vault.sol");
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
    const r1EndTime = presentTime + 3600 * 24 * 60;
    const capPercent = "100";
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
    // deploy
    membershipContract = await ProtocolContract.new(name, symbol, vaultAddress);
    console.log("Membership Contract: ", membershipContract.address);
    console.log("Deploy Phase Completed");
    // perform actions - Fake Assignments
    for (let index = 0; index < 16; index++) {
      await membershipContract.assignTo(accounts[index + 1], [], {
        from: accounts[0]
      });
    }

    daicoToken = await DaicoToken.new(stringName, stringSymbol, vaultAddress, totalMintableSupply);
    console.log("Daico Token Contract: ", daicoToken.address);
    lockedTokens = await LockedTokens.new(daicoToken.address);
    console.log("Locked Token Contract: ", lockedTokens.address);
    pollFactory =
      network === "development"
        ? await PollFactory.new(
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
            tapIncrementFactor,
            { gas: 6900000 }
          )
        : await PollFactory.new(
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
    // starts round 1
    await crowdSale.startNewRound();
    // buys crowdsale r1
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.25", "ether").toString(),
      from: accounts[2]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.15", "ether").toString(),
      from: accounts[3]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.1", "ether").toString(),
      from: accounts[4]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.05", "ether").toString(),
      from: accounts[5]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.05", "ether").toString(),
      from: accounts[6]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.01", "ether").toString(),
      from: accounts[7]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.03", "ether").toString(),
      from: accounts[8]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.02", "ether").toString(),
      from: accounts[9]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.04", "ether").toString(),
      from: accounts[10]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.02", "ether").toString(),
      from: accounts[11]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.02", "ether").toString(),
      from: accounts[12]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.01", "ether").toString(),
      from: accounts[13]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.025", "ether").toString(),
      from: accounts[14]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.013", "ether").toString(),
      from: accounts[15]
    });
    await crowdSale.sendTransaction({
      value: await web3.utils.toWei("0.092", "ether").toString(),
      from: accounts[16]
    });
    callback(membershipContract.address);
  } catch (error) {
    callback(error);
  }
}

module.exports = DeployMembership;
