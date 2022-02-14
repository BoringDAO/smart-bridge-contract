import { ethers, network, getChainId } from "hardhat";
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
import { NBridge } from "../../src/types/NBridge";
import { parseEther } from "ethers/lib/utils";
import { TestIToken } from "../../src/types/TestIToken";
import { Token } from "../../src/types/Token";
import { BigNumberish } from "ethers";
const hre = require('hardhat')

async function main() {
	console.log(`network ${network.name} ${Number(await getChainId())}`)
	let accounts = await ethers.getSigners()
	let ti;
	let tokenChainId;
	let crosser = "0xbC41ef18DfaE72b665694B034f608E6Dfe170149"
	// let feeTo = await accounts[3].getAddress()
	let feeTo = "0x09587012B3670D75a90930be9282d98063E402a2"
	// let networkToChange = ['okex_test', 'avax_test', 'harmony_test', 'heco_test', 'fantom_test', 'xdai_test']
	// let networkToChange = ['okex_test', 'avax_test', 'heco_test', 'fantom_test', 'xdai_test']
	// let networkToChange = ["bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai"]
	// let networkToChange = [ "arbi", "op", "boba"]
	let networkToChange = [ "oasis"]
	// let networkToChange = ["avax", "matic", "heco", "fantom", "xdai"]
	// let networkToChange = ["bsc"]
	let contracts = JSON.parse(getContractsAddress())
	let originChainId = '1'
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
			nb = await attach("NBridge", contracts[chainid.toString()]['nbridge']) as NBridge
		} else {
			nb = await getNBridge()
		}
		// switch (network.config.chainId!) {
		// 	case Number(originChainId):
		// 		await setupNBridge(nb, feeTo)
		// 		break;
		// 	default:
		// 		await setupNBridge(nb, feeTo)
		// }
		await setupNBridge(nb, feeTo)
		contracts[chainid.toString()]['NBridge'] = nb.address
		writeContractAddress(JSON.stringify(contracts))
	}
}

async function getNBridge(): Promise<NBridge> {
	return await deployNBridge(network.config.chainId!)
}

async function deployNBridge(chainID: number): Promise<NBridge> {
	console.log(`will deploy nbridge with chainid ${chainID}`)
	let nb = await deployProxy<NBridge>("NBridge", chainID)
	return nb;
}

async function setupNBridge(nb: NBridge, feeTo: string) {
	let tx4 = await nb.setFeeTo(feeTo)
	console.log(`setFeeTo ${tx4.hash}`)
	await tx4.wait(2)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});