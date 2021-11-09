import { ethers, network, getChainId } from "hardhat";
import { attach, deploy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
import { NBridge } from "../../src/types/NBridge";
import { parseEther } from "ethers/lib/utils";
import { TestIToken } from "../../src/types/TestIToken";
import { Token } from "../../src/types/Token";
import { BigNumberish } from "ethers";
const hre = require('hardhat')
import * as contractInfo from "../../contracts.json"

async function main() {
	console.log(`network ${network.name} ${Number(await getChainId())}`)
	let accounts = await ethers.getSigners()
	// let networkToChange = ['okex_test', 'avax_test', 'harmony_test', 'heco_test', 'fantom_test', 'xdai_test']
	// let networkToChange = ['okex_test', 'avax_test', 'heco_test', 'fantom_test', 'xdai_test']
	let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai"]
	let contracts = JSON.parse(getContractsAddress())
	let tokenName = 'boring'
	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let chainid = network.config.chainId!
		console.log(`network name ${network.name} ${network.config.chainId!}`)
		if (contracts[chainid.toString()]['twoway_chef'] != undefined) {
			continue
		}
		await deploy("BoringChef")
	}
}