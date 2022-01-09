import { parseEther } from "ethers/lib/utils"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	let mock_account = "0xbC41ef18DfaE72b665694B034f608E6Dfe170149"
	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [mock_account],
	});
	const signer = await ethers.getSigner(mock_account)

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
		let tokenAddr = contracts[chainIdStr][tokenSymbol]
		let nb2 = nb.connect(signer)
		// let tx = await nb2.crossOut(tokenAddr, 1, await signer.getAddress(), parseEther("0.6"))
		// tx.wait()
		// let p = {""}
		// nb2.crossIn({_originChainId: 56, _originToken: "0xA58950F05FeA2277d2608748412bf9F802eA4901", f})
		let txCrossIn = await nb2.crossIn({ _originToken: "0xA58950F05FeA2277d2608748412bf9F802eA4901", _originChainId: 56, fromChainId: 56, toChainId: 1088, from: "0x0Dc22D3ff46373379BDd25Da9111F727FD84B757", to: "0x4F497F9D85A6fE135fFca99f0f253919fE827211", amount: ethers.utils.parseEther("2480759000"), txid: "0x83f265da52cca362c1e0f8c57c6aca5aded7d4d729bbab7011a418b363d20db5" })
		await txCrossIn.wait()


		// let feeTo = await nb2.feeTo()
		// console.log(feeTo)

		// let chainId = await nb.chainId()
		// console.log(`chainId ${chainId}`)
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});