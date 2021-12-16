import {ethers, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { deploy, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	let networkToChange = ['matic_test']
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
		contracts[cChainId]['USDT'] = usdtToken!.address
		writeContractAddress(JSON.stringify(contracts))
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});