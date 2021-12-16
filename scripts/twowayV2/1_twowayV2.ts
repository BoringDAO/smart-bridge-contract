import { Contract } from "ethers";
import {ethers, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { deploy, deployProxy, getContractsAddress, writeContractAddress } from "../helper";
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
		let twAddr: Contract
		if (n == center_chain) {
			twAddr = await deployProxy("TwoWayCenter", cChainId)
		} else {
			twAddr = await deployProxy("TwoWayEdge", cChainId)
		}
		contracts[cChainIdStr]['TwoWayV2'] = twAddr.address
		writeContractAddress(JSON.stringify(contracts))
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});