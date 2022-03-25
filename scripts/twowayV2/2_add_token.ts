import { BigNumberish, Contract } from "ethers";
import { ethers, getChainId, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	// let crosser_test = "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
	let crosser = "0x9037772a588A2b6725fe2360c0356B7f0140b5d2" // mainnet
	// let crosser = "0xF15F3CE67D07ab9983Fa29142855c51608252A84" // test
	let whiteAddress = "0xcDfEb124CFc9649D9C33df9B69AeA0C094b3EF5E"
	let contracts = JSON.parse(getContractsAddress())
	let usdtToken: TestERC20
	// let networkToChange = ['kcc']
	// let networkToChange2 = ['mainnet', 'bsc', 'matic', 'okex', 'heco' , 'fantom', 'harmony', 'avax', 
	// 			'xdai', 'op', 'arbi', 'metis', 'aurora', 'kcc']
	let networkToChange = ['mainnet', 'bsc', 'matic', 'avax', 'kcc', 'heco', 'okex', 'arbi', 'op']
	let networkToChange2 = ['mainnet', 'bsc', 'matic', 'avax', 'kcc', 'heco', 'okex', 'arbi', 'op']
	

				// ETH-WBTC
				// BSC-BBTC
				// Polygon-WBTC
				// Avax-WBTC
				// KCC-BTCK
				// HECO-HBTC
				// OKX-BTCK
				// Arb-WBTC
				// OP-WBTC			
	// let networkToChange = ['harmony', 'avax', 
	// 			'xdai', 'op', 'arbi', 'metis', 'aurora']
	// let networkToChange2 = ['kcc']
	
	// eth
	// let isCoin = new Map<string, boolean>([
	// 	["mainnet", true],
	// 	["bsc", false],
	// 	["matic", false],
	// 	["okex", false],
	// 	["heco", false],
	// 	["fantom", false],
	// 	["harmony", false],
	// 	["avax", false],
	// 	["xdai", false],
	// 	["op", true],
	// 	["arbi", true],
	// 	["metis", false],
	// 	["aurora", true],
	// 	["kcc", false]
	// ]
	// );

	let isCoin = new Map<string, boolean>([
		["mainnet", false],
		["bsc", false],
		["matic", false],
		["okex", false],
		["heco", false],
		["fantom", false],
		["harmony", false],
		["avax", false],
		["xdai", false],
		["op", false],
		["arbi", false],
		["metis", false],
		["aurora", false],
		["kcc", false]
	]
	);
	let center_chain = "matic"
	let tokenSymbol = "PBTC"
	let oTokenSymbol = "o" + tokenSymbol
	let feeToTreasuryRatio = "0.65"
	let tokenPriece = 39000
	let lowAmount = (2).toFixed(8)
	let highAmount = (25).toFixed(8)
	let fixFeeToETH = (60 / tokenPriece).toFixed(8)
	let fixFeeToL2 = (10 / tokenPriece).toFixed(8)
	let fixFeeToNormal = (2 / tokenPriece).toFixed(8)
	console.log(`lowAmount ${lowAmount} highAmount ${highAmount}`)
	console.log(`fixFeeToETH ${fixFeeToETH} fixFeeToL2 ${fixFeeToL2} fixFeeToNormal ${fixFeeToNormal}`)
	console.log(`gooooo`)
	let ratioHigh = ethers.utils.parseEther("0.01")
	let ratioMedium = ethers.utils.parseEther("0.003")
	let ratioLow = ethers.utils.parseEther("0.0005")

	let remainLow = ethers.utils.parseEther(lowAmount)
	let remainHigh = ethers.utils.parseEther(highAmount)


	for (let n of networkToChange) {
		hre.changeNetwork(n)
		const accounts = await ethers.getSigners();
		console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		let tw: TwoWayCenter | TwoWayEdge
		// todo
		if (n == center_chain) {
			tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
			// setOToken
			let oToken
			if (contracts[cChainIdStr][oTokenSymbol] == undefined || contracts[cChainIdStr][oTokenSymbol] == "") {
				oToken = await deployProxy("TwoWayCenterToken", oTokenSymbol, oTokenSymbol) as TwoWayCenterToken
				let minterRole = await oToken.MINTER_ROLE()
				let burnerRole = await oToken.BURNER_ROLE()
				let txSetMinter = await oToken.grantRole(minterRole, tw.address)
				console.log(`tx set minter ${txSetMinter.hash} `)
				await txSetMinter.wait()
				let txSetBurner = await oToken.grantRole(burnerRole, tw.address)
				console.log(`tx set burner ${txSetBurner.hash} `)
				await txSetBurner.wait()

				await setting_crosser(tw, oToken.address, crosser)

				// set rawToken
				// let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
				// await setting_crosser(tw, rawTokenAddr, crosser_test)
				// threshold
				let txSetThreshold = await tw.setThreshold(oToken.address, 1);
				console.log(`tx setThreshold ${txSetThreshold.hash}`)
				await txSetThreshold.wait()
				// whiteaddress
				let txSetWhiteAddress = await tw.setWhitelist(oToken.address, whiteAddress, true)
				console.log(`tx set white address ${txSetWhiteAddress.hash}`)
				await txSetWhiteAddress.wait()

				await setFeeToTreasury(tw, oToken.address, feeToTreasuryRatio)


				contracts[cChainIdStr][oTokenSymbol] = oToken.address
			} else {
				oToken = await attach("ERC20", contracts[cChainIdStr][oTokenSymbol]) as TwoWayCenterToken
			}

			let toChainIds = []
			let fixFees = []
			let ratioFeesHigh = []
			let ratioFeesMedium = []
			let ratioFeesLow = []
			let remains = [remainHigh, remainLow]
			for (let edgeChain of networkToChange2) {
				// if (n == edgeChain) {
				// 	continue
				// }
				// console.log(`edge chain ${edgeChain}`)
				// if (!['arbi', 'metis', 'aurora'].includes(edgeChain)) {
				// 	continue
				// }
				console.log(`edge chain ${edgeChain}`)
				console.log(`${oToken.address}`)
				console.log(`${contracts[getChainIdByName(edgeChain)][tokenSymbol]}`)
				let tx = await tw.addToken(oToken.address, getChainIdByName(edgeChain), contracts[getChainIdByName(edgeChain)][tokenSymbol])
				console.log(`add token ${tx.hash}`)
				await tx.wait()
				toChainIds.push(getChainIdByName(edgeChain))
				if (edgeChain == "mainnet" || edgeChain == "kovan") {
					fixFees.push(ethers.utils.parseEther(fixFeeToETH))
				} else if (edgeChain == "boba" || edgeChain == "op" || edgeChain == "arbi" || edgeChain == "metis") {
					fixFees.push(ethers.utils.parseEther(fixFeeToL2))
				} else {
					fixFees.push(ethers.utils.parseEther(fixFeeToNormal))
				}
				ratioFeesHigh.push(ratioHigh)
				ratioFeesMedium.push(ratioMedium)
				ratioFeesLow.push(ratioLow)
			}
			let txSetFee = await tw.setFee(oToken.address, toChainIds, fixFees, ratioFeesHigh, ratioFeesMedium, ratioFeesLow, remains)
			console.log(`tx set fee ${txSetFee.hash}`)
			await txSetFee.wait()

			if (isCoin.get(n)) {
				let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
				let tx = await tw.setIsCoin(rawTokenAddr, true)
				console.log(`set is coin: ${tx.hash}`)
				await tx.wait()
			}

		} else {
			tw = await attach("TwoWayEdge", contracts[cChainIdStr]['TwoWayV2']) as TwoWayEdge
			let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
			let tokenIsSupport = await tw.tokenSupported(rawTokenAddr)
			if (!tokenIsSupport) {
				let tx = await tw.addSupport(rawTokenAddr)
				console.log(`edge chain add token ${tx.hash}`)
				await tx.wait()
			}

			await setting_crosser(tw, rawTokenAddr, crosser)

			let threshold = await tw.threshold(rawTokenAddr)
			if (threshold.eq(0)) {
				let txSetThreshold = await tw.setThreshold(rawTokenAddr, 1);
				console.log(`tx setThreshold ${txSetThreshold.hash}`)
				await txSetThreshold.wait()
			}

			let _tokens: string[] = [];
			let _chainIds: BigNumberish[] = [];
			let statuses: boolean[] = []
			for (let chainName of networkToChange2) {
				if (chainName != n) {
					console.log(`${chainName}`)
					// if (['mainnet', 'bsc', 'matic', 'okex', 'heco', 'harmony', 'avax', 'xdai', 'op'].includes(chainName)) {
					// if (['mainnet', 'bsc', 'matic'].includes(chainName)) {
					// 	continue
					// }
					let isSupported = await tw.chainSupported(rawTokenAddr, getChainIdByName(chainName))
					if (!isSupported) {
						_tokens.push(rawTokenAddr)
						_chainIds.push(getChainIdByName(chainName))
						statuses.push(true)

					}
				}
			}
			let txChain = await tw.changeMultiSupport(_tokens, _chainIds, statuses)
			console.log(`tx edgeChain changeMultiSupport ${txChain.hash} token ${_tokens} chainid ${_chainIds}`)
			console.log(`tx hash ${txChain.hash}`)
			await txChain.wait(2)

			// if (isCoin.get(n)) {
			// 	let tx = await tw.setIsCoin(rawTokenAddr, true)
			// 	console.log(`set is coin: ${tx.hash}`)
			// 	await tx.wait()
			// }
		}


		writeContractAddress(JSON.stringify(contracts))
	}

}

async function setting_crosser(tw: TwoWayCenter | TwoWayEdge, toToken: string, crosser: string) {
	let crosser_key = await tw.getRoleKey(toToken)
	let hasRole = await tw.hasRole(crosser_key, crosser)
	if (!hasRole) {
		let tx = await tw.grantRole(crosser_key, crosser)
		console.log(`set crosser ${tx.hash}`)
		await tx.wait()
	}
}

async function setFeeToTreasury(tw: TwoWayCenter, oToken: string, ratio: string) {
	let tx = await tw.setFeeToTreasuryRatio(oToken, ethers.utils.parseEther(ratio))
	console.log(`set fee to treasury ${tx.hash}`)
	await tx.wait()
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});