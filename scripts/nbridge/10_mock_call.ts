import { parseEther } from "ethers/lib/utils"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()

	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: ["0x53E34401091B531654b8AAEd4EE03AD3e75A0629"],
	});
	const signer = await ethers.getSigner("0x53E34401091B531654b8AAEd4EE03AD3e75A0629")

	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["xdai"]	
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["hardhat"]
	// let networkToChange = ['heco']
	let contracts = JSON.parse(getContractsAddress())
	let allChain = ["mainnet", "metis"]
	let tokenSymbol = "AAVE"
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
		let tokenAddr  = contracts[chainIdStr][tokenSymbol]
		let nb2 = nb.connect(signer)
		// let tx = await nb2.crossOut(tokenAddr, 1, await signer.getAddress(), parseEther("0.6"))
		// tx.wait()
		let feeTo = await nb2.feeTo()
		console.log(feeTo)
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});