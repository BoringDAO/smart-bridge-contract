import { Contract } from "ethers";
import {ethers, getChainId, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();
	let crosser_test = "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	let center_chain = "matic_test"
	let tokenSymbol = "USDT"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		if (n == center_chain) {
			let tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
			// setOToken
			let oToken = await deployProxy("TwoWayCenterToken", "oUSDT", "oUSDT") as TwoWayCenterToken
			contracts[cChainIdStr]['oUSDT'] = oToken.address
			for (let edgeChain of networkToChange) {
				let tx = await tw.addToken(oToken.address, getChainIdByName(edgeChain), contracts[getChainIdByName(edgeChain)][tokenSymbol])
				console.log(`add token ${tx.hash}`)
				await tx.wait()
			}
			await setting_crosser(tw, oToken.address, crosser_test)
			// set rawToken
			let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
			await setting_crosser(tw, rawTokenAddr, crosser_test)


		} else {
			let tw = await attach("TwoWayEdge", contracts[cChainIdStr]['TwoWayV2']) as TwoWayEdge
			let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
			// if (n == 'kovan' || n.endsWith('test')) {
			// 	await setting_crosser(tw, crosser_test)
			// }
			let tx = await tw.addSupport(rawTokenAddr)
			console.log(`edge chain add token ${tx.hash}`)
			await tx.wait()

			await setting_crosser(tw, rawTokenAddr, crosser_test)

			for (let chainName of networkToChange) {
				if (chainName != n) {
					let txChain = await tw.changeSupport(rawTokenAddr, getChainIdByName(chainName), true)	
					console.log(`tx edgeChain changeSupport ${txChain.hash}`)
				}
			}
		}
		writeContractAddress(JSON.stringify(contracts))
	}

}

async function setting_crosser(tw: TwoWayCenter|TwoWayEdge, toToken: string, crosser: string) {
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