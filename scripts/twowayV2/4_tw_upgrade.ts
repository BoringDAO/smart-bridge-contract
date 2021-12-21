import { Contract } from "ethers";
import {ethers, network, upgrades } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter";
import { attach, deploy, deployProxy, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	let center_chain = "matic_test"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		let twAddr = contracts[cChainIdStr]['TwoWayV2']
		if (n == center_chain) {
			let centerFac = await ethers.getContractFactory("TwoWayCenter")
			await upgrades.upgradeProxy(twAddr, centerFac)
		} else {
			let centerEdge = await ethers.getContractFactory("TwoWayEdge")
			await upgrades.upgradeProxy(twAddr, centerEdge)
		}
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});