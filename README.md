# ElectusProtocol

<!-- <img align="center" src="./img/colonyNetwork_color.svg" /> -->

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/ElectusProtocol/Lobby)
[![CircleCI](https://circleci.com/gh/chaitanyapotti/ElectusProtocol/tree/master.svg?style=shield)](https://circleci.com/gh/chaitanyapotti/ElectusProtocol/tree/master)
[![Greenkeeper badge](https://badges.greenkeeper.io/chaitanyapotti/ElectusProtocol.svg)](https://greenkeeper.io/)
[![codecov](https://codecov.io/gh/chaitanyapotti/ElectusProtocol/branch/master/graph/badge.svg)](https://codecov.io/gh/chaitanyapotti/ElectusProtocol)

## Install

```
git clone https://github.com/chaitanyapotti/ElectusProtocol.git
cd ElectusProtocol
npm install
```

## Contracts

The protocol level contracts use OpenZeppelin extensively for referencing standard EIPs.
Electus Protocol utilizes OpenZeppelin's implementations for EIP-165 and EIP-173.
Please refer to OpenZeppelin's github page [here](https://github.com/OpenZeppelin/openzeppelin-solidity)

## truffle

To use with Truffle, first install it and initialize your project with `truffle init`.

```sh
npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

## Installing Electus Protocol

After installing either Framework, to install the Electus Protocol library, run the following in your Solidity project root directory:

```sh
npm init -y
npm install --save electusprotocol
```

After that, you'll get all the library's contracts in the `node_modules/electusprotocol/contracts` folder. You can use the contracts in the library like so:

```solidity
import 'electusprotocol/contracts/Protocol/IElectusProtocol.sol';

contract MyContract is IElectusProtocol {
  ...
}
```

#Linting
To lint solidity, use

```sh
node ./node_modules/solhint ./contracts/poll/BasePoll.sol
```

For linting Solidity files you need to run Solhint with one or more Globs as arguments. For example, to lint all files inside contracts directory, you can do:

```sh
solhint "contracts/**/*.sol"
```

To lint a single file:

```sh
solhint contracts/MyToken.sol
```

To disable linting for next line, use

// solhint-disable-next-line

To use eslint,

```sh
node .\node_modules\eslint\bin\eslint.js . --fix
```

## Testing

Unit test are critical to the Electus Protocol framework. They help ensure code quality and mitigate against security vulnerabilities. The directory structure within the `/test` directory corresponds to the `/contracts` directory. OpenZeppelin uses Mocha’s JavaScript testing framework and Chai’s assertion library. To learn more about how to tests are structured, please reference Electus Protocol's Testing Guide.

To run all tests:

Start ganache-cli or other testrpc

```
npm run test
truffle test
```

## Security

Electus Protocol is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problem you might experience.

The core development principles and strategies that Electus Protocol is based on include: security in depth, simple and modular code, clarity-driven naming conventions, comprehensive unit testing, pre-and-post-condition sanity checks, code consistency, and regular audits.

If you find a security issue, please email [chaitanya@electus.network](mailto:chaitanya@electus.network).

## Contributing

For details about how to contribute you can check the [contributing page](CONTRIBUTING.md)
