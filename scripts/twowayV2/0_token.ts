import {ethers, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { deploy, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let oToken: TestERC20
	let oTokenName = "WETH"
	let oTokenSymbol = "WETH"
	let networkToChange = ['matic_test']
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		oToken = await deploy("TestERC20", oTokenName, oTokenSymbol, 18) as TestERC20
		contracts[cChainId][oTokenSymbol] = oToken!.address
		writeContractAddress(JSON.stringify(contracts))
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});