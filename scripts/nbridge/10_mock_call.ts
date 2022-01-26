import { parseEther } from "ethers/lib/utils"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { ERC20 } from "../../src/types/ERC20"
import { NBridge } from "../../src/types/NBridge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	// let mock_account = "0xbC41ef18DfaE72b665694B034f608E6Dfe170149"
	// let mock_account = "0x2353178C6c05378812f024A783541857634A1e82"
	// await hre.network.provider.request({
	// 	method: "hardhat_impersonateAccount",
	// 	params: [mock_account],
	// });
	// const signer = await ethers.getSigner(mock_account)
	// const signer = accounts[22]

	// let networkToChange = ["xdai"]	
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["metis"]
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
		let accounts = await ethers.getSigners()
		let chainid = network.config.chainId!
		let chainIdStr = network.config.chainId!.toString()
		console.log(`network name ${network.name} ${network.config.chainId!} account ${await accounts[0].getAddress()}`)
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
		// let nb2 = nb.connect(signer)
		let nb2 = nb
		// let tx = await nb2.crossOut(tokenAddr, 1, await signer.getAddress(), parseEther("0.6"))
		// tx.wait()
		// let p = {""}
		// nb2.crossIn({_originChainId: 1, _originToken: "0xA58950F05FeA2277d2608748412bf9F802eA4901", f})
		// let txCrossIn = await nb2.crossIn({ _originToken: "0xcFEB09C3c5F0f78aD72166D55f9e6E9A60e96eEC", _originChainId: 1, fromChainId: 1, toChainId: 56, from: "0x9c92607b90B10dE396a303dAD38fc350D0652e02", to: "0x9c92607b90B10dE396a303dAD38fc350D0652e02", amount: ethers.utils.parseEther("14706.0403"), txid: "0x37b02f98ebcefc75f4f5ed011ce7fc3c6760a5ff0ef590816577380cf3b8b641"})
		let txCrossIn = await nb2.crossIn({ _originToken: "0xa58950f05fea2277d2608748412bf9f802ea4901", _originChainId: 56, fromChainId: 56, toChainId: 1088, from: "0x0dc22d3ff46373379bdd25da9111f727fd84b757", to: "0x0dc22d3ff46373379bdd25da9111f727fd84b757", amount: ethers.utils.parseEther("2480759000"), txid: "0x83f265da52cca362c1e0f8c57c6aca5aded7d4d729bbab7011a418b363d20db5"})
		console.log(`crossIn ${txCrossIn.hash}`)
		await txCrossIn.wait()


		// let tok = await ethers.getContractAt("ERC20", "0x7eFC12F4b6A577393c98465FB90E280f2EBC5995") as ERC20
		// let txApprove = await tok.approve(nb2.address, ethers.constants.MaxUint256)
		// console.log(`txApprove ${txApprove.hash}`)
		// await txApprove.wait(1)
		// let txCrossOut = await nb2.crossOut("0x7eFC12F4b6A577393c98465FB90E280f2EBC5995", 97, "0x2353178C6c05378812f024A783541857634A1e82", ethers.utils.parseEther("100"))
		// console.log(`crossOut ${txCrossOut.hash}`)
		// await txCrossOut.wait(2)


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