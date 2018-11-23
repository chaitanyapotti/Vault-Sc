#Vault - Smart Contracts

[![npm version](https://badge.fury.io/js/vault-sc.svg)](https://badge.fury.io/js/vault-sc)

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/ElectusProtocol/Lobby)

[![CircleCI](https://circleci.com/gh/chaitanyapotti/Vault-Sc/tree/master.svg?style=shield)](https://circleci.com/gh/chaitanyapotti/Vault-Sc/tree/master)

[![Greenkeeper badge](https://badges.greenkeeper.io/chaitanyapotti/Vault-Sc.svg)](https://greenkeeper.io/)

[![codecov](https://codecov.io/gh/chaitanyapotti/Vault-Sc/branch/master/graph/badge.svg)](https://codecov.io/gh/chaitanyapotti/Vault-Sc)

## Install

```
git clone https://github.com/chaitanyapotti/Vault-Sc.git
cd Vault-Sc
npm install
```

## Contracts

The protocol level contracts use OpenZeppelin extensively for referencing standard EIPs.
Vault utilizes OpenZeppelin's implementations for EIP-165 and EIP-173.
Please refer to OpenZeppelin's github page [here](https://github.com/OpenZeppelin/openzeppelin-solidity)

## truffle

To use with Truffle, first install it and initialize your project with `truffle init`.

```sh
npm install -g truffle@5.0.0-beta.1
mkdir myproject && cd myproject
truffle init
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

Vault-Sc is meant to provide secure, tested and community-audited code, but please use common sense when doing anything that deals with real money! We take no responsibility for your implementation decisions and any security problem you might experience.

The core development principles and strategies that Vault is based on include: security in depth, simple and modular code, clarity-driven naming conventions, comprehensive unit testing, pre-and-post-condition sanity checks, code consistency, and regular audits.

If you find a security issue, please email [chaitanya@electus.network](mailto:chaitanya@electus.network).

## Contributing

For details about how to contribute you can check the [contributing page](CONTRIBUTING.md)
