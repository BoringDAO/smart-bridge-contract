/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { CrossToken, CrossTokenInterface } from "../CrossToken";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "address",
        name: "_crosser",
        type: "address",
      },
      {
        internalType: "address",
        name: "_xToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "xToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "yToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "CrossBurn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "xToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "yToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "txid",
        type: "string",
      },
    ],
    name: "CrossMint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "CROSSER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "crossBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addrFromETH",
        type: "address",
      },
      {
        internalType: "address",
        name: "recepient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_txid",
        type: "string",
      },
    ],
    name: "crossMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "txMinted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "xToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b506040516200198f3803806200198f8339810160408190526200003491620002dd565b8351849084906200004d90600390602085019062000167565b5080516200006390600490602084019062000167565b5050600680546001600160a01b0319166001600160a01b038416179055506200008e600033620000b3565b620000a96b43524f535345525f524f4c4560a01b83620000b3565b50505050620003bc565b620000bf8282620000c3565b5050565b60008281526005602090815260408083206001600160a01b038516845290915290205460ff16620000bf5760008281526005602090815260408083206001600160a01b03851684529091529020805460ff19166001179055620001233390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b828054620001759062000369565b90600052602060002090601f016020900481019282620001995760008555620001e4565b82601f10620001b457805160ff1916838001178555620001e4565b82800160010185558215620001e4579182015b82811115620001e4578251825591602001919060010190620001c7565b50620001f2929150620001f6565b5090565b5b80821115620001f25760008155600101620001f7565b80516001600160a01b03811681146200022557600080fd5b919050565b600082601f8301126200023b578081fd5b81516001600160401b0380821115620002585762000258620003a6565b604051601f8301601f19908116603f01168101908282118183101715620002835762000283620003a6565b816040528381526020925086838588010111156200029f578485fd5b8491505b83821015620002c25785820183015181830184015290820190620002a3565b83821115620002d357848385830101525b9695505050505050565b60008060008060808587031215620002f3578384fd5b84516001600160401b03808211156200030a578586fd5b62000318888389016200022a565b955060208701519150808211156200032e578485fd5b506200033d878288016200022a565b9350506200034e604086016200020d565b91506200035e606086016200020d565b905092959194509250565b600181811c908216806200037e57607f821691505b60208210811415620003a057634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b6115c380620003cc6000396000f3fe608060405234801561001057600080fd5b506004361061014d5760003560e01c806336568abe116100c357806395d89b411161007c57806395d89b4114610305578063a217fddf1461030d578063a457c2d714610315578063a9059cbb14610328578063d547741f1461033b578063dd62ed3e1461034e57600080fd5b806336568abe1461027a578063395093511461028d57806356cf02d9146102a0578063589a9e6e146102b657806370a08231146102c957806391d14854146102f257600080fd5b806318160ddd1161011557806318160ddd146101fb57806323b872dd1461020d578063248a9ca31461022057806329b89a09146102435780632f2ff15d14610258578063313ce5671461026b57600080fd5b806301ffc9a71461015257806306fdde031461017a578063088b699e1461018f578063095ea7b3146101ba57806310c27402146101cd575b600080fd5b610165610160366004611313565b610387565b60405190151581526020015b60405180910390f35b6101826103be565b6040516101719190611482565b6006546101a2906001600160a01b031681565b6040516001600160a01b039091168152602001610171565b6101656101c83660046112b0565b610450565b6101656101db36600461133b565b805160208183018101805160078252928201919093012091525460ff1681565b6002545b604051908152602001610171565b61016561021b36600461120f565b610466565b6101ff61022e3660046112d9565b60009081526005602052604090206001015490565b61025661025136600461124a565b610515565b005b6102566102663660046112f1565b610673565b60405160128152602001610171565b6102566102883660046112f1565b61069e565b61016561029b3660046112b0565b61071c565b6101ff6b43524f535345525f524f4c4560a01b81565b6102566102c43660046112b0565b610758565b6101ff6102d73660046111c3565b6001600160a01b031660009081526020819052604090205490565b6101656103003660046112f1565b6107bf565b6101826107ea565b6101ff600081565b6101656103233660046112b0565b6107f9565b6101656103363660046112b0565b610892565b6102566103493660046112f1565b61089f565b6101ff61035c3660046111dd565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b60006001600160e01b03198216637965db0b60e01b14806103b857506301ffc9a760e01b6001600160e01b03198316145b92915050565b6060600380546103cd90611526565b80601f01602080910402602001604051908101604052809291908181526020018280546103f990611526565b80156104465780601f1061041b57610100808354040283529160200191610446565b820191906000526020600020905b81548152906001019060200180831161042957829003601f168201915b5050505050905090565b600061045d3384846108c5565b50600192915050565b60006104738484846109e9565b6001600160a01b0384166000908152600160209081526040808320338452909152902054828110156104fd5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b61050a85338584036108c5565b506001949350505050565b61052e6b43524f535345525f524f4c4560a01b336107bf565b6105845760405162461bcd60e51b815260206004820152602160248201527f43726f7373546f6b656e3a3a63616c6c6572206973206e6f742063726f7373656044820152603960f91b60648201526084016104f4565b8060078160405161059591906113a2565b9081526040519081900360200190205460ff16156105e15760405162461bcd60e51b81526020600482015260096024820152681d1e081b5a5b9d195960ba1b60448201526064016104f4565b60016007836040516105f391906113a2565b908152604051908190036020019020805491151560ff1990921691909117905561061d8484610bb9565b6006546040517f6a63f74ecc819d2b6dcd082e3d41016177d95577813b4f7fc5431d7fe6e4738e91610664916001600160a01b039091169030908990899089908990611433565b60405180910390a15050505050565b60008281526005602052604090206001015461068f8133610c98565b6106998383610cfc565b505050565b6001600160a01b038116331461070e5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084016104f4565b6107188282610d82565b5050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161045d918590610753908690611495565b6108c5565b6107623382610de9565b600654604080516001600160a01b0392831681523060208201523381830152918416606083015260808201839052517f63db45e521861dc5b6514d863ebf6814df6c1079c65b0d1b49a59ac5c5d4aebc9181900360a00190a15050565b60009182526005602090815260408084206001600160a01b0393909316845291905290205460ff1690565b6060600480546103cd90611526565b3360009081526001602090815260408083206001600160a01b03861684529091528120548281101561087b5760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084016104f4565b61088833858584036108c5565b5060019392505050565b600061045d3384846109e9565b6000828152600560205260409020600101546108bb8133610c98565b6106998383610d82565b6001600160a01b0383166109275760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016104f4565b6001600160a01b0382166109885760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016104f4565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038316610a4d5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016104f4565b6001600160a01b038216610aaf5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016104f4565b6001600160a01b03831660009081526020819052604090205481811015610b275760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016104f4565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610b5e908490611495565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610baa91815260200190565b60405180910390a35b50505050565b6001600160a01b038216610c0f5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016104f4565b8060026000828254610c219190611495565b90915550506001600160a01b03821660009081526020819052604081208054839290610c4e908490611495565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b610ca282826107bf565b61071857610cba816001600160a01b03166014610f37565b610cc5836020610f37565b604051602001610cd69291906113be565b60408051601f198184030181529082905262461bcd60e51b82526104f491600401611482565b610d0682826107bf565b6107185760008281526005602090815260408083206001600160a01b03851684529091529020805460ff19166001179055610d3e3390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b610d8c82826107bf565b156107185760008281526005602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6001600160a01b038216610e495760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b60648201526084016104f4565b6001600160a01b03821660009081526020819052604090205481811015610ebd5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b60648201526084016104f4565b6001600160a01b0383166000908152602081905260408120838303905560028054849290610eec9084906114cc565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3505050565b60606000610f468360026114ad565b610f51906002611495565b67ffffffffffffffff811115610f7757634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f191660200182016040528015610fa1576020820181803683370190505b509050600360fc1b81600081518110610fca57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600f60fb1b8160018151811061100757634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600061102b8460026114ad565b611036906001611495565b90505b60018111156110ca576f181899199a1a9b1b9c1cb0b131b232b360811b85600f166010811061107857634e487b7160e01b600052603260045260246000fd5b1a60f81b82828151811061109c57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060049490941c936110c38161150f565b9050611039565b5083156111195760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e7460448201526064016104f4565b9392505050565b80356001600160a01b038116811461113757600080fd5b919050565b600082601f83011261114c578081fd5b813567ffffffffffffffff8082111561116757611167611577565b604051601f8301601f19908116603f0116810190828211818310171561118f5761118f611577565b816040528381528660208588010111156111a7578485fd5b8360208701602083013792830160200193909352509392505050565b6000602082840312156111d4578081fd5b61111982611120565b600080604083850312156111ef578081fd5b6111f883611120565b915061120660208401611120565b90509250929050565b600080600060608486031215611223578081fd5b61122c84611120565b925061123a60208501611120565b9150604084013590509250925092565b6000806000806080858703121561125f578081fd5b61126885611120565b935061127660208601611120565b925060408501359150606085013567ffffffffffffffff811115611298578182fd5b6112a48782880161113c565b91505092959194509250565b600080604083850312156112c2578182fd5b6112cb83611120565b946020939093013593505050565b6000602082840312156112ea578081fd5b5035919050565b60008060408385031215611303578182fd5b8235915061120660208401611120565b600060208284031215611324578081fd5b81356001600160e01b031981168114611119578182fd5b60006020828403121561134c578081fd5b813567ffffffffffffffff811115611362578182fd5b61136e8482850161113c565b949350505050565b6000815180845261138e8160208601602086016114e3565b601f01601f19169290920160200192915050565b600082516113b48184602087016114e3565b9190910192915050565b7f416363657373436f6e74726f6c3a206163636f756e74200000000000000000008152600083516113f68160178501602088016114e3565b7001034b99036b4b9b9b4b733903937b6329607d1b60179184019182015283516114278160288401602088016114e3565b01602801949350505050565b6001600160a01b03878116825286811660208301528581166040830152841660608201526080810183905260c060a0820181905260009061147690830184611376565b98975050505050505050565b6020815260006111196020830184611376565b600082198211156114a8576114a8611561565b500190565b60008160001904831182151516156114c7576114c7611561565b500290565b6000828210156114de576114de611561565b500390565b60005b838110156114fe5781810151838201526020016114e6565b83811115610bb35750506000910152565b60008161151e5761151e611561565b506000190190565b600181811c9082168061153a57607f821691505b6020821081141561155b57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fdfea2646970667358221220eb7e2750c434d459c10c9b4d65ad26c45a9eac6c7027ee926e6aa23b53c8f61964736f6c63430008040033";

export class CrossToken__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _name: string,
    _symbol: string,
    _crosser: string,
    _xToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CrossToken> {
    return super.deploy(
      _name,
      _symbol,
      _crosser,
      _xToken,
      overrides || {}
    ) as Promise<CrossToken>;
  }
  getDeployTransaction(
    _name: string,
    _symbol: string,
    _crosser: string,
    _xToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _crosser,
      _xToken,
      overrides || {}
    );
  }
  attach(address: string): CrossToken {
    return super.attach(address) as CrossToken;
  }
  connect(signer: Signer): CrossToken__factory {
    return super.connect(signer) as CrossToken__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CrossTokenInterface {
    return new utils.Interface(_abi) as CrossTokenInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CrossToken {
    return new Contract(address, _abi, signerOrProvider) as CrossToken;
  }
}
