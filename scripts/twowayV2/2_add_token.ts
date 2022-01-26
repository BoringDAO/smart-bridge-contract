import { Contract } from "ethers";
import { ethers, getChainId, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	// let crosser_test = "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
	let crosser_test = "0x9037772a588A2b6725fe2360c0356B7f0140b5d2"
	let whiteAddress = "0xcDfEb124CFc9649D9C33df9B69AeA0C094b3EF5E"
	let contracts = JSON.parse(getContractsAddress())
	let usdtToken: TestERC20
	// let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	// let center_chain = "matic_test"
	// let networkToChange = ['matic', 'heco', 'okex']
	// let networkToChange = ['mainnet', 'bsc', 'okex', 'heco' , 'fantom', 'avax', 'xdai', 'op', 'arbi', 'metis', 'harmony']
	// let networkToChange = ['bsc', 'fantom', 'avax', 'xdai', 'op', 'arbi', 'metis', 'harmony']
	// let networkToChange = ['op', 'arbi', 'metis', 'harmony', 'aurora']
	let networkToChange = ['matic', 'okex', 'mainnet']
	let networkToChange2 = ['matic','okex', 'mainnet']
	// let networkToChange2 = ['matic', 'mainnet', 'bsc', 'okex', 'heco', 'fantom', 'avax', 'xdai', 'op', 'arbi', 'metis', 'harmony', 'aurora']
	// let networkToChange2 = ['bsc', 'okex', 'heco', 'fantom', 'avax', 'xdai', 'op', 'arbi', 'metis', 'harmony', 'aurora']
	// let networkToChange2 = ['heco', 'okex']
	// let networkToChange2 = ['arbi', 'metis', 'harmony']
	let center_chain = "matic"
	let tokenSymbol = "FIN"
	let oTokenSymbol = "o"+tokenSymbol
	let tokenPriece = 0.16
	let lowAmount = (100000 / tokenPriece).toString()
	let highAmount = (500000 / tokenPriece).toString()
	let fixFeeToETH = (60 / tokenPriece).toString()
	let fixFeeToL2 = (10 / tokenPriece).toString()
	let fixFeeToNormal = (2 / tokenPriece).toString()
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
		// todo
		if (n == center_chain) {
			let tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
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

				await setting_crosser(tw, oToken.address, crosser_test)

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



		} else {
			let tw = await attach("TwoWayEdge", contracts[cChainIdStr]['TwoWayV2']) as TwoWayEdge
			let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]

			let tx = await tw.addSupport(rawTokenAddr)
			console.log(`edge chain add token ${tx.hash}`)
			await tx.wait()

			await setting_crosser(tw, rawTokenAddr, crosser_test)

			let txSetThreshold = await tw.setThreshold(rawTokenAddr, 1);
			console.log(`tx setThreshold ${txSetThreshold.hash}`)
			await txSetThreshold.wait()

			for (let chainName of networkToChange2) {
				if (chainName != n) {
					console.log(`${chainName}`)
					// if (chainName == 'matic' || chainName == 'mainnet' || chainName == 'fantom') {
					// 	console.log(`inin`)
					// 	continue
					// }
					let txChain = await tw.changeSupport(rawTokenAddr, getChainIdByName(chainName), true)
					console.log(`tx edgeChain changeSupport ${txChain.hash} token ${rawTokenAddr} chainid ${getChainIdByName(chainName)}`)
					await txChain.wait()
				}
			}
		}
		writeContractAddress(JSON.stringify(contracts))
	}

}

async function setting_crosser(tw: TwoWayCenter | TwoWayEdge, toToken: string, crosser: string) {
	let crosser_key = await tw.getRoleKey(toToken)
	let tx = await tw.grantRole(crosser_key, crosser)
	console.log(`set crosser ${tx.hash}`)
	await tx.wait()
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});