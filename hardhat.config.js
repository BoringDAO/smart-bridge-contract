require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require("./tasks/bridge")

const { mnemonic, projectId, privateKeyETH, privateKeyOkex, etherscanKey, privateKeyBSC } = require("./.secret.json");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: etherscanKey
  },
  networks: {
    hardhat: {},
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${projectId}`,
    //   gasPrice: 40 * 10 ** 9,
    //   accounts: [privateKeyETH],
    // },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${projectId}`,
      accounts: {
        mnemonic: mnemonic,
      },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${projectId}`,
      accounts: {
        mnemonic: mnemonic,
      },
    },
    bsc_test: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: {
        mnemonic: mnemonic
      }
    },
    // bsc: {
    //   url: "https://bsc-dataseed.binance.org",
    //   accounts: [privateKeyBSC]
    // },
    okex_test: {
      url: "https://exchaintestrpc.okex.org",
      chainId: 65,
      accounts: {
        mnemonic: mnemonic
      }
    },
    // okex: {
    //   url: "https://exchainrpc.okex.org",
    //   chainId: 66,
    //   accounts: [privateKeyOkex]
    // }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      66: 0
    },
    crosser1: {
      default: 1,
      66: 0
    },
    crosser2: {
      default: 2
    }
  }
};
