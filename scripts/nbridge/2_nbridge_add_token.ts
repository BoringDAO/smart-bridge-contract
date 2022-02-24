import { parseEther } from "ethers/lib/utils"
import { ethers, getChainId, network } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { Token } from "../../src/types/Token"
import { attach, getChainIdByName, getContractsAddress } from "../helper"
const hre = require('hardhat')

async function main() {
	console.log(`network ${network.name} ${Number(await getChainId())}`)
	// let crosser = "0xbC41ef18DfaE72b665694B034f608E6Dfe170149" // mainnet
	let crosser = "0xF15F3CE67D07ab9983Fa29142855c51608252A84" // test
	let feeTo = "0x09587012B3670D75a90930be9282d98063E402a2"
	// let networkToChange = ["harmony_test", "aurora_test"]
	let networkToChange = ["aurora_test"]
	// let allChain = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", "boba", "op","arbi", "metis", "aurora"]
	let allChain = ["harmony_test", "aurora_test"]
	let contracts = JSON.parse(getContractsAddress())
	let originChainId = getChainIdByName("harmony_test")
	let tokenSymbol = 'ONE'
	let isDeployedByMe = true
	let originToken = contracts[originChainId][tokenSymbol]
	let isCoin = true

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
		let crosserKey = await nb.getRoleKey(originToken, Number(originChainId))
		switch (network.config.chainId!) {
			case Number(originChainId):
				await setupNBridge(nb, originToken, Number(originChainId), crosserKey, crosser, feeTo, allChain, tokenSymbol)
				await addOriginSupportToken(nb, originToken, chainid)
				let tx = await nb.setIsCoin(originToken, true)
				console.log(`set is coin: ${tx.hash}`)
				break;
			default:
				let tokenAddr = contracts[chainid.toString()][tokenSymbol]
				// await setupNBridge(nb, originToken, Number(originChainId), crosserKey, crosser, feeTo, allChain, tokenSymbol)
				// await grantMinterBurner(nb, tokenAddr, isDeployedByMe)
				await addDeriveSupportToken(nb, originToken, Number(originChainId), tokenAddr, chainid)
		}
	}
}


async function grantMinterBurner(nb: NBridge, tokenAddr: string, isDeployedByMe: boolean) {
	console.log(`token ${tokenAddr} grant minter and burner`)
	let token = await attach("Token", tokenAddr) as Token
	console.log(`grant role to bridge ${nb.address}`)
	const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
	const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
	if (isDeployedByMe) {
		let tx = await token.grantRole(minter, nb.address)
		console.log(`tx ${tx.hash} grant minter`)
		await tx.wait()
		let txBurn = await token.grantRole(burner, nb.address)
		console.log(`tx ${txBurn.hash} grant burner`)
		await txBurn.wait()
	}
}

async function setupNBridge(nb: NBridge, originToken: string, originChainId: number, crosserKey: string, crosser: string, feeTo: string, allChain: string[], tokenSymbol: string) {
	let tx2 = await nb.setThreshold(originToken, 1)
	console.log(`setThreshold ${tx2.hash}`)
	await tx2.wait()
	let tx5 = await nb.grantRole(crosserKey, crosser)
	console.log(`grantRole crosser ${tx5.hash}`)
	await tx5.wait()
}

async function addDeriveSupportToken(nb: NBridge, originToken: string, originChainId: number, deriveToken: string, deriveChainId: number) {
	// let ti = { tokenType: 2, mirrorAddress: originToken, mirrorChainId: originChainId, isSupported: true }
	// let tx = await nb.addSupportToken(deriveChainId, deriveToken, ti)
	// console.log(`addSupportToken ${tx.hash}`)
	// await tx.wait(2)
	let ti1 = { tokenType: 2, mirrorAddress: deriveToken, mirrorChainId: deriveChainId, isSupported: true }
	let tx1 = await nb.addSupportToken(originChainId, originToken, ti1)
	console.log(`addSupportToken ${tx1.hash}`)
	await tx1.wait()

}

async function addOriginSupportToken(nb: NBridge, originToken: string, originChainId: number) {
	let ti = { tokenType: 1, mirrorAddress: originToken, mirrorChainId: originChainId, isSupported: true }
	let tx = await nb.addSupportToken(originChainId, originToken, ti)
	console.log(`addSupportToken ${tx.hash}`)
	await tx.wait()
}

async function changeCrosser(nb: NBridge, crosser1: string, crosser2: string, originToken: string, originChainId: number) {
	let roleKey = await nb.getRoleKey(originToken, originChainId)
	let txRevoke = await nb.revokeRole(roleKey, crosser1)
	console.log("revoke crosser")
	await txRevoke.wait(1)
	let txGrant = await nb.grantRole(roleKey, crosser2)
	console.log("grant role")
	await txGrant.wait()
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});