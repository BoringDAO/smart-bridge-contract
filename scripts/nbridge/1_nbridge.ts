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
	let networkToChange = [ "bsc", "metis"]
	// let networkToChange = ["avax", "matic", "heco", "fantom", "xdai"]
	// let networkToChange = ["bsc"]
	let contracts = JSON.parse(getContractsAddress())
	let originChainId = '56'
	let tokenName = 'lowb'
	let originToken = contracts[originChainId][tokenName]
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}
	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let chainid = network.config.chainId!
		console.log(`network name ${network.name} ${network.config.chainId!} originToken ${originToken}`)
		let nb: NBridge
		if (contracts[chainid.toString()]['nbridge'] != undefined) {
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
		let crosserKey = await nb.getRoleKey(originToken, Number(originChainId))
		switch (network.config.chainId!) {
			case Number(originChainId):
				await setupNBridge(nb, originToken, Number(originChainId), crosserKey, crosser, feeTo)
				await addOriginSupportToken(nb, originToken, chainid)
				break;
			default:
				let boringAddr = contracts[chainid.toString()][tokenName]
				await setupNBridge(nb, originToken, Number(originChainId), crosserKey, crosser, feeTo)
				await grantMinterBurner(nb, boringAddr)
				await addDeriveSupportToken(nb, originToken, Number(originChainId), boringAddr, chainid)
		}
		// contracts[chainid.toString()]['nbridge'] = nb.address
		// writeContractAddress(JSON.stringify(contracts))
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

async function grantMinterBurner(nb: NBridge, tokenAddr: string) {
	console.log(`token ${tokenAddr} grant minter and burner`)
	let token = await attach("Token", tokenAddr) as Token
	console.log(`grant role to bridge ${nb.address}`)
	const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
	const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
	let tx = await token.grantRole(minter, nb.address)
	console.log(`tx ${tx.hash} grant minter`)
	await tx.wait()
	let txBurn = await token.grantRole(burner, nb.address)
	console.log(`tx ${txBurn.hash} grant burner`)
	await txBurn.wait()
}

async function setupNBridge(nb: NBridge, originToken: string, originChainId: number, crosserKey: string, crosser: string, feeTo: string) {
	let tx2 = await nb.setThreshold(originToken, 1)
	console.log(`setThreshold ${tx2.hash}`)
	await tx2.wait()
	let tx3 = await nb.setFee(originToken, parseEther("0.005"))
	console.log(`setFee ${tx3.hash}`)
	await tx3.wait()
	let tx4 = await nb.setFeeTo(feeTo)
	console.log(`setFeeTo ${tx4.hash}`)
	await tx4.wait(2)
	let tx5 = await nb.grantRole(crosserKey, crosser)
	console.log(`grantRole crosser ${tx5.hash}`)
	await tx5.wait()
	if (network.config.chainId! != originChainId) {
		let txMinCross = await nb.setMinCrossAmount(originToken, originChainId, parseEther("100000"))
		console.log(`tx minCrossAmount ${txMinCross.hash} ${network.config.chainId}`)
	}
}

async function addDeriveSupportToken(nb: NBridge, originToken: string, originChainId: number, deriveToken: string, deriveChainId: number) {
	let ti = { tokenType: 2, mirrorAddress: originToken, mirrorChainId: originChainId, isSupported: true }
	let tx = await nb.addSupportToken(deriveChainId, deriveToken, ti)
	console.log(`addSupportToken ${tx.hash}`)
	await tx.wait(2)
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