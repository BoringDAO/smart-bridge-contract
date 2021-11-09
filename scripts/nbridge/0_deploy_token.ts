import { deploy, getContractsAddress, writeContractAddress } from "../helper";
import { TestIToken } from "../../src/types/TestIToken"
import { ethers, getChainId, hardhatArguments, network } from "hardhat";
import { parseEther } from "@ethersproject/units";
import { Token } from "../../src/types/Token";
const hre = require("hardhat")
import contractInfo from "../../contracts.json";
import { readFile } from "node:fs";
import { getChainIdByName } from "../helper"


async function main1() {
	// kovan BSC matic
	let info = getContractsAddress()
	let infoJSON = JSON.parse(info)
	// let networkToChange = ['okex_test', 'avax_test',  'heco_test', 'fantom_test', 'xdai_test', 'harmony_test']
	// let networkToChange = ['okex_test', 'avax_test',  'heco_test', 'fantom_test', 'xdai_test']
	// let networkToChange = ["avax", "matic", "heco", "fantom", "xdai"]
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai"]
	let networkToChange = ["bsc"]
	let accounts = await ethers.getSigners()
	let deployer = await accounts[0].getAddress()
	let originChain = "mainnet"
	let tokenName = "xVEMP"
	let tokenSymbol = "xVEMP"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let token
		let chainId = network.config.chainId?.toString()!
		console.log(network.name, network.config.chainId)
		if (infoJSON[chainId][tokenSymbol] != undefined) {
			continue
		}
		console.log(infoJSON[chainId])
		if (infoJSON[chainId] == undefined) {
			// infoJSON[chainId]['boring'] = token.address
			// infoJSON[chainId] = token.address
			infoJSON[chainId] = {}
			infoJSON[chainId]['network_name'] = network.name
		}
		if (infoJSON[chainId][tokenSymbol] == undefined || infoJSON[chainId][tokenSymbol] == '') {
			if (network.name === originChain) {
				token = await deploy("TestIToken", tokenName, tokenSymbol, parseEther("100000000")) as Token
			} else {
				token = await deploy("Token", tokenName, tokenSymbol) as Token
			}
			infoJSON[chainId][tokenSymbol] = token.address
			writeContractAddress(JSON.stringify(infoJSON))
		}
	}
}

main1()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});