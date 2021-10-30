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

const { polygonTestUrl, polygonURL, mnemonic, privateKeyETH, privateKeyOkex, etherscanKey, privateKeyBSC, privateKeyAVAX, privateKeyMatic } = require("./.secret.json");


const projectId = process.env.INFURA_KEY
const privateKey = process.env.Private_Key

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
    // op_kovan:{
    //   url:`https://kovan.optimism.io`,
    //   accounts:[`${privateKey}`],
    //   gasPrice:10000,
    // },
    hardhat: {},
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      gasPrice: 70 * 10 ** 9,
      accounts: [privateKeyETH],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${projectId}`,
      accounts: [`0x${privateKey}`],
      gasPrice: 7 * 10 ** 9,
      gas: 21000
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${projectId}`,
      accounts: [`0x${privateKey}`],
      gasPrice:7 * 10 ** 9,
      gas: 21000
    },
    // bsc_test: {
    //   url: "https://data-seed-prebsc-2-s1.binance.org:8545",
    //   chainId: 97,
    //   accounts: [`0x${privateKey}`],
    //   gas: 10000000
    // },
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: [privateKeyBSC]
    },
    // okex_test: {
    //   url: "https://exchaintestrpc.okex.org",
    //   chainId: 65,
    //   accounts: [`0x${privateKey}`],
    //   gas: 10000000
    // },
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
    harmony: {
      url: "https://api.harmony.one",
      chainId: 1666600000,
      accounts: [privateKeyAVAX]
    },
    harmony_test: {
      url: "https://api.s0.pops.one",
      chainId: 1666700000,
      accounts: {
        mnemonic: mnemonic
      }
    },
    matic_test: {
      // url: "https://rpc-mumbai.maticvigil.com",
      // url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
      // url: "https://matic-mumbai.chainstacklabs.com",
      url: polygonTestUrl,
      chainId: 80001,
      accounts: {
        mnemonic: mnemonic
      }
    },
    matic: {
      // url: "https://rpc-mainnet.maticvigil.com",
      url: polygonURL,
      chainId: 137,
      accounts: [privateKeyMatic]
    },
    heco_test: {
      url: "https://http-testnet.hecochain.com",
      chainId: 256,
      accounts: {
        mnemonic: mnemonic
      }
    },
    heco: {
      url: "https://http-mainnet-node.huobichain.com",
      chainId: 128,
      accounts: [privateKeyAVAX]
    },
    fantom: {
      url: "https://rpcapi.fantom.network",
      chainId: 250,
      accounts: [privateKeyAVAX]
    },
    fantom_test: {
      url: "https://rpc.testnet.fantom.network",
      chainId: 4002,
      accounts: {
        mnemonic: mnemonic
      }
    },
    xdai_test: {
      url: "https://sokol.poa.network",
      chainId: 77,
      accounts: {
        mnemonic: mnemonic
      }
    },
    xdai: {
      url: "https://rpc.xdaichain.com",
      chainId: 100,
      accounts: [privateKeyAVAX]
    },
    moonriver_test: {
      url: "https://rpc.testnet.moonbeam.network",
      chainId: 1287,
      accounts: {
        mnemonic: mnemonic
      }
    },
    moonriver: {
      url: "https://rpc.moonriver.moonbeam.network",
      chainId: 1285
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