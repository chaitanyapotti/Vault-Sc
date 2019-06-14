const HDWalletProvider = require("truffle-hdwallet-provider");

// This is a test mnemomic and doesn't contain real ether Use it at your own risk
const mnemonic =
  "blue inherit drum enroll amused please camp false estate flash sell right";
const infuraKey = "dc22c9c6245742069d5fe663bfa8a698";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    coverage: {
      host: "localhost",
      port: 8555, // <-- Use port 8555
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01, // <-- Use this low gas price
      network_id: "*"
    },
    kovan: {
      provider: new HDWalletProvider(
        mnemonic,
        `https://kovan.infura.io/v3/${infuraKey}`,
        0,
        20
      ),
      network_id: "42",
      gas: 6900000,
      gasPrice: 10000000000
    },
    rinkeby: {
      provider: new HDWalletProvider(
        mnemonic,
        `https://rinkeby.infura.io/v3/${infuraKey}`,
        0,
        20
      ),
      network_id: "3",
      gas: 6900000,
      gasPrice: 2000000000
    },
    ropsten: {
      provider: new HDWalletProvider(
        mnemonic,
        `https://ropsten.infura.io/v3/${infuraKey}`,
        0,
        20
      ),
      network_id: "1",
      gas: 6900000,
      gasPrice: 10000000000
    },
    main: {
      provider: new HDWalletProvider(
        mnemonic,
        `https://mainnet.infura.io/v3/${infuraKey}`,
        0,
        20
      ),
      network_id: "0",
      gas: 6900000,
      gasPrice: 1000000000
    }
  },
  mocha: {
    useColors: true
  },
  compilers: {
    solc: {
      version: "0.4.25",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 600 // Default: 200
        }
      }
    }
  }
};
