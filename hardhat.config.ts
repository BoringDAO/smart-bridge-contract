// import { HardhatUserConfig} from "hardhat/config";
import { HardhatUserConfig } from 'hardhat/types'
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "hardhat-change-network";

import { ethers } from "hardhat";
import { count } from 'console';

const { polygonTestUrl, polygonURL, mnemonic, mnemonicMainnet, projectId, privateKeyETH, privateKeyOkex, etherscanKey, privateKeyBSC, privateKeyAVAX, privateKeyMatic } = require("./.secret.json");

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
    hardhat: {
      forking: {
      // url: polygonURL,
      // blockNumber: 23635986,
      // url: "https://rpc-mumbai.maticvigil.com",
      url: "https://matic-mumbai.chainstacklabs.com",
      // url: polygonTestUrl,
      // url: "https://andromeda.metis.io/?owner=1088", 
        // url: `https://kovan.infura.io/v3/${projectId}`,
        // url: `https://mainnet.infura.io/v3/${projectId}`,
        // url: "https://bsc-dataseed.binance.org",
      },
      // accounts: [privateKeyBSC],
      // accounts: [privateKeyAVAX],
      accounts: {
        mnemonic: mnemonicMainnet,
        initialIndex: 22,
        count: 30
        
      },
      // chainId: 80001
      chainId: 137 
      // chainId: 1088
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKeyETH],
      chainId: 1
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
      chainId: 42
    },
    bsc_test: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
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
      // accounts: {
      //   mnemonic: mnemonicMainnet,
      //   initialIndex: 22,
      //   count: 30
      // },
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
      accounts: {
        mnemonic: mnemonicMainnet,
        count: 30,
        // 20 deployer
        initialIndex: 20
      }
    },
    harmony: {
      url: "https://api.harmony.one",
      chainId: 1666600000,
      accounts: [privateKeyAVAX]
    },
    harmony_test: {
      // url: "https://api.s0.pops.one",
      url: "https://api.s0.b.hmny.io",
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
      accounts: {
        mnemonic: mnemonicMainnet,
        initialIndex: 24,
        count: 30
      }
    },
    fantom: {
      // url: "https://rpcapi.fantom.network",
      url: "https://rpc.ftm.tools",
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
      accounts: [privateKeyAVAX],
      timeout: 600000,
      // gasPrice: 199999999200
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
    arbi: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [privateKeyAVAX],
    },
    arbi_test: {
      url: "https://rinkeby.arbitrum.io/rpc",
      chainId: 421611,
      accounts: {
        mnemonic: mnemonic
      }

    },
    op: {
      url: "https://mainnet.optimism.io",
      chainId: 10,
      accounts: [privateKeyAVAX],
    },
    op_test: {
      url: "https://kovan.optimism.io",
      chainId: 69,
      accounts: {
        mnemonic: mnemonic
      }
    },
    boba: {
      url: "https://mainnet.boba.network/",
      chainId: 288,
      accounts: [privateKeyAVAX]
    },
    metis: {
      url: "https://andromeda.metis.io/?owner=1088", 
      chainId: 1088,
      accounts: [privateKeyAVAX],
      // accounts: {
      //   mnemonic: mnemonicMainnet,
      //   initialIndex: 22,
      //   count: 30
      // },
    },
    metis_test: {
      url: "https://stardust.metis.io/?owner=588",
      chainId: 588,
      accounts: {
        mnemonic: mnemonic
      }
    },
    aurora: {
      url: "https://mainnet.aurora.dev",
      chainId: 1313161554,
      accounts: [privateKeyAVAX]
    },
    aurora_test: {
      url: "https://testnet.aurora.dev",
      chainId: 1313161555,
      accounts: {
        mnemonic: mnemonic
      }
    },
    klaytn: {
      url: "https://public-node-api.klaytnapi.com/v1/cypress",
      chainId: 8217,
      accounts: [privateKeyAVAX]
    },
    klaytn_test: {
      url: "https://api.baobab.klaytn.net:8651",
      chainId: 1001,
      accounts: {
        mnemonic: mnemonic
      }
    },
    t1: {
      url: "http://127.0.0.1:8545",
      // chainId: 31337
    },
    t2: {
      url: "http://127.0.0.1:8546",
      // chainId: 31338
    },
    t3: {
      url: "http://127.0.0.1:8547"
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