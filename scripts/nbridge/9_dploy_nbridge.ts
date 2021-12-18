import { ethers, getChainId, network, upgrades } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getContractsAddress, writeContractAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["matic", "fantom", "op", 'arbi', 'boba']
	let networkToChange = ["metis"]
	// 'op', 'arbi', 'boba']
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
			const NBridgeFactory = await ethers.getContractFactory("NBridge")
			let nb = await deployProxy<NBridge>("NBridge", chainid)
			console.log(nb.address)
			contracts[chainid.toString()]["NBridge"] = nb.address
			writeContractAddress(JSON.stringify(contracts))

		}
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});