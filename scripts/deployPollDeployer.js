var PollDeployerContract = artifacts.require("./PollDeployer.sol");

// execution: truffle exec .\scripts\deployPollDeployer.js --network development
async function DeployPollDeployer(callback) {
  try {
    let pollDeployerContract;
    // setup
    const accounts = await web3.eth.getAccounts();
    // deploy
    pollDeployerContract = await PollDeployerContract.new({ from: accounts[0], gas: 4000000 });
    // vaultcontract = await VaultContract.at("0x0c9b0313cf272fced1fc9034c151967e814df274");
    console.log("Poll Deployer Contract: ", pollDeployerContract.address);
    console.log("Deploy Phase Completed");

    callback(pollDeployerContract.address);
  } catch (error) {
    callback(error);
  }
}

module.exports = DeployPollDeployer;
