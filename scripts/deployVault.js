var VaultContract = artifacts.require("./Vault.sol");

// execution: truffle exec .\scripts\deployVault.js --network development
async function DeployVault(callback) {
  try {
    let vaultcontract;
    // setup
    const accounts = await web3.eth.getAccounts();
    const fee = web3.utils.toWei("0.0015", "ether");
    const issuerFee = web3.utils.toWei("0.5015", "ether");
    const name = web3.utils.fromAscii("Vault");
    const symbol = web3.utils.fromAscii("VAULT");
    const attributes = { Country: ["India", "USA", "China"], isIssuer: ["true", "false"] };
    // deploy
    vaultcontract = await VaultContract.new(name, symbol, fee, issuerFee);
    console.log("Vault Contract: ", vaultcontract.address);
    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        const element = attributes[key];
        const attributeHeader = web3.utils.fromAscii(key);
        const mappedElements = element.map(item => web3.utils.fromAscii(item));
        await vaultcontract.addAttributeSet(attributeHeader, mappedElements);
      }
    }
    console.log("Deploy Phase Completed");
    // perform actions - Fake Assignments
    await vaultcontract.assignTo(accounts[1], [0, 1], {
      from: accounts[0]
    });
    for (let index = 0; index < 15; index++) {
      await vaultcontract.assignTo(accounts[index + 2], [0, 0], {
        from: accounts[0]
      });
    }
    callback(vaultcontract.address);
  } catch (error) {
    callback(error);
  }
}

module.exports = DeployVault;
