import { parseEther } from "ethers/lib/utils"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["xdai"]	
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["mainnet", "metis"]
	// let networkToChange = ['heco']
	let contracts = JSON.parse(getContractsAddress())
	let allChain = ["mainnet", "metis"]
	let tokenSymbol = "CRV"
	let specialChain = "mainnet"
	let toEthFixFee = "12"
	let toLayer2FixFee = "2"
	let toNormalFixFee = "0.01"
	let ratioFee = "0.005"

	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}	

	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let chainid = network.config.chainId!
		let chainIdStr = network.config.chainId!.toString()
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
			// nb.calculateFee
		} else {
			console.log("network error: nbridge not exist")
			process.exit(-1)
		}
		let tokens = []
		let toChainIds = []
		let fixes = []
		let ratios = []
		for (let c of allChain) {
			if (c == network.name) {
				continue
			}
			let token = contracts[chainIdStr][tokenSymbol]
			tokens.push(token)
			toChainIds.push(getChainIdByName(c))
			if (c == "mainnet") {
				fixes.push(parseEther(toEthFixFee))
			} else if (c == "op" || c == "arbi" || c == "boba" || c == "metis") {
				fixes.push(parseEther(toLayer2FixFee))
			}else {
				fixes.push(parseEther(toNormalFixFee))
			}
			ratios.push(parseEther(ratioFee))

		}
		for (let i=0; i < tokens.length; i++) {
			console.log(`${tokens[i]} ${toChainIds[i]} ${fixes[i]} ${ratios[i]}`)
		}
		// continue
		let txSetFees = await nb.setFees(tokens, toChainIds, fixes, ratios)
		console.log(`txSetFees ${txSetFees.hash}`)
		await txSetFees.wait()
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});