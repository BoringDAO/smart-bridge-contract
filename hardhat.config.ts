// import { HardhatUserConfig} from "hardhat/config";
import { HardhatUserConfig } from 'hardhat/types'
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter"

import { ethers } from "hardhat";

const { mnemonic, projectId, privateKeyETH, privateKeyOkex, etherscanKey, privateKeyBSC, privateKeyAVAX } = require("./.secret.json");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.6",
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
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      gasPrice: 25 * 10 ** 9,
      accounts: [privateKeyETH],
    },
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
      url: "https://data-seed-prebsc-2-s1.binance.org:8545",
      chainId: 97,
      accounts: {
        mnemonic: mnemonic
      },
      gas: 10000000
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: [privateKeyBSC]
    },
    okex_test: {
      url: "https://exchaintestrpc.okex.org",
      chainId: 65,
      accounts: {
        mnemonic: mnemonic
      },
      gas: 10000000
    },
    avax: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [privateKeyAVAX]
    },
    avax_test: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: {
        mnemonic: mnemonic
      }
    },
    okex: {
      url: "https://exchainrpc.okex.org",
      chainId: 66,
      accounts: [privateKeyOkex]
    },
    harmony0: {
      url: "https://api.harmony.one",
      chainId: 1666600000,
      accounts: [privateKeyAVAX]
    },
    matic_test: {
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: {
        mnemonic: mnemonic
      }
    },
    matic: {
      url: "https://rpc-mainnet.maticvigil.com",
      chainId: 137,
      // accounts: [privateKey]
      accounts: {
        mnemonic: mnemonic
      }
    },
    t1: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    t2: {
      url: "http://127.0.0.1:8546",
      // chainId: 31338
    }
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
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  abiExporter: {
    path: './data/abi',
    clear: true,
    flat: true,
    spacing: 2
  }
};

export default config;