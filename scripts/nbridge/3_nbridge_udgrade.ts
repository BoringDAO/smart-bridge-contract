import { ethers, getChainId, network, upgrades } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// upgraded: bsc metis matic fantom heco okex harmony avax xdai mainnet
	// let networkToChange = ["matic", "fantom", "op", 'arbi', 'boba']
	let networkToChange = ["harmony_test", "aurora_test"]
	// let networkToChange = ['xdai']
	let contracts = JSON.parse(getContractsAddress())

	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}	

	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let chainid = network.config.chainId!
		console.log(`network name ${network.name} ${network.config.chainId!}`)
		let nb: NBridge
		if (contracts[chainid.toString()]['NBridge'] != undefined) {
			// if (network.config.chainId == 100) {
			// 	nb = await attach("NBridge", contracts[chainid.toString()]['nbridge']) as NBridge
			// } else {
			// 	continue
			// }
			// continue
			nb = await attach("NBridge", contracts[chainid.toString()]['NBridge']) as NBridge
		} else {
			console.log("network error: nbridge not exist")
			process.exit(-1)
		}
		const NBridgeFactory = await ethers.getContractFactory("NBridge")

		// let result = await upgrades.upgradeProxy("0xf6b692D5502C0b24384Ca11f169A9973a363de5a", NBridgeFactory)
		// console.log("what", result.address)
		await upgrades.upgradeProxy(nb.address, NBridgeFactory)
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});