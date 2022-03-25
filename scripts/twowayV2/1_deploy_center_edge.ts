import { Contract } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import {ethers, network, upgrades } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter";
import { TwoWayEdge } from "../../src/types/TwoWayEdge";
import { deploy, deployProxy, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();
	let feeTo = "0x09587012B3670D75a90930be9282d98063E402a2"
	let treasuryTo = "0xf26b49Dd3EfBC46e4272611898f9d0e42BAD9A6b"

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	// let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	// let center_chain = "matic_test"
	// let networkToChange = ['mainnet', 'bsc', 'fantom', 'avax', 'xdai', 'harmony', 'op', 'arbi', 'boba']
	// let networkToChange = ['mainnet', 'bsc', 'fantom', 'avax', 'xdai', 'harmony', 'op', 'arbi', 'metis']
	// let networkToChange = ['mainnet', 'fantom', 'avax', 'xdai', 'harmony', 'op', 'arbi', 'metis']
	// let networkToChange = ['op', 'arbi', 'metis']
	let networkToChange = ['kcc']
	let center_chain = "matic"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		let twAddr: Contract
		if (n == center_chain) {
			twAddr = await deployProxy<TwoWayCenter>("TwoWayCenter", cChainId, feeTo, treasuryTo)
		} else {
			twAddr = await deployProxy<TwoWayEdge>("TwoWayEdge", cChainId)
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