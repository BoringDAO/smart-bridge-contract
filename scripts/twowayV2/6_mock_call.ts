import { parseEther } from "ethers/lib/utils"
import { utimes } from "fs"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { ERC20 } from "../../src/types/ERC20"
import { NBridge } from "../../src/types/NBridge"
import { StakingReward } from "../../src/types/StakingReward"
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayChef } from "../../src/types/TwoWayChef"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	// let mock_user = "0x2353178C6c05378812f024A783541857634A1e82"
	// let mock_user = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
	// let mock_user = "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
	// let mock_user = "0xB45C219eFf9A489Ef4287DC19fE6e942637445dE"
	// let mock_user = "0x53E34401091B531654b8AAEd4EE03AD3e75A0629"
	// await hre.network.provider.request({
	// 	method: "hardhat_impersonateAccount",
	// 	params: [mock_user],
	// });
	// const signer = await ethers.getSigner(mock_user)

	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["xdai"]	
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["fantom"]
	// let networkToChange = ['heco']
	let contracts = JSON.parse(getContractsAddress())
	// let allChain = ["mainnet", "metis"]
	// let allChain
	let tokenSymbol = "USDT"

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
		// let tw: TwoWayCenter|TwoWayEdge
		let tw: TwoWayEdge
		if (contracts[chainid.toString()]['TwoWayV2'] != undefined) {
			// if (network.config.chainId == 100) {
			// 	nb = await attach("NBridge", contracts[chainid.toString()]['nbridge']) as NBridge
			// } else {
			// 	continue
			// }
			// continue
			let twAddr = contracts[chainid.toString()]['TwoWayV2'];
			console.log(`twAddr ${twAddr}`)
			tw = await attach("TwoWayCenter", twAddr) as TwoWayEdge
			// nb.calculateFee
		} else {
			console.log("network error: nbridge not exist")
			process.exit(-1)
		}
		// let tokenAddr  = contracts[chainIdStr][tokenSymbol]
		// let index = await tw.eventIndex0(42)
		// let height = await tw.eventHeights0(42, index)
		// console.log(`index ${ethers.utils.formatUnits(index, 0)}`)
		// console.log(`height ${ethers.utils.formatUnits(height, 0)}`)
		// let chainid_edge = await tw.chainId()
		// console.log(`chainid ${ethers.utils.formatUnits(chainid_edge, 0)}`)

		// let twChefAddr = contracts[chainid.toString()]['TwoWayChef']
		// let twChef = await attach("TwoWayChef", twChefAddr) as TwoWayChef
		await check_cross_index(tw, 1088)
		// await check_1_index(tw, 1088)
		// await check_chef(twChef)


		// let oSymbol = "oiZi"
		// let oTokenAddr = contracts[chainIdStr][oSymbol]
		// await check_fee(tw, oTokenAddr, [1, 56, 137, 1088])


		// edge_token
		// let oTokenAddr = contracts[chainIdStr]['oMETIS']
		// let edgeTokenAddr = contracts[chainIdStr]['METIS']
		// let edgeToken = await tw.toEdgeToken(oTokenAddr, 1)
		// console.log(`edgeToken ${edgeToken}`)
		// tw.chainSupported(edgeTokenAddr, 137)


		// check isHandled
		// await checkTransactionIshandled(tw, "0xeb43e69e77f7076825adf73e0d340aa720aabd0033de9041548c1eb52d139750", "ForwardCrossOuted")
	}

}

async function check_chef(chef: TwoWayChef) {
	let len = await chef.poolLength()
	console.log(`pool len: ${len}`)
	let len_str = Number(ethers.utils.formatUnits(len, 0))
	for (let i=0; i < len_str; i++) {
		let info = await chef.poolInfo(i)
		console.log(`info ${info}`)
	}
}

async function check_cross_index(tw: TwoWayCenter|TwoWayEdge, toChainId: number) {
	let index = await tw.eventIndex0(toChainId)	
	let indexNumber = Number(ethers.utils.formatUnits(index, 0))
	for (let i=214; i <= indexNumber; i++) {
		let height = await tw.eventHeights0(toChainId, i)
		console.log(`${toChainId} index ${i} height ${height}`)
	}
}


async function check_1_index(tw: TwoWayCenter|TwoWayEdge, toChainId: number) {
	let index = await tw.eventIndex1()	
	let indexNumber = Number(ethers.utils.formatUnits(index, 0))
	for (let i=1; i <= indexNumber; i++) {
		let height = await tw.eventHeights1(i)
		console.log(`${toChainId} index ${i} height ${height}`)
	}
}

async function check_fee(tw: TwoWayCenter, otoken: string, edgeChainIds: number[]) {
	for (const id of edgeChainIds) {
		let fixFee = await tw.fixFees(otoken, id)
		let fixFeeStr = ethers.utils.formatUnits(fixFee, 0)
		let ratioHigh = await tw.ratioFeesHigh(otoken, id)
		let ratioHighStr  = ethers.utils.formatUnits(ratioHigh, 0)
		let ratioMedium = await tw.ratioFeesMedium(otoken, id)
		let ratioMediumStr = ethers.utils.formatUnits(ratioMedium, 0)
		let ratioLow = await tw.ratioFeesLow(otoken, id)
		let ratioLowStr = ethers.utils.formatUnits(ratioLow, 0)
		console.log(`fixFee ${fixFeeStr} ratioHigh ${ratioHighStr} ratioLow ${ratioLowStr}`)
	}
}

async function checkTransactionIshandled(tw: TwoWayEdge, txid: string, eventName: string) {
	let isHandled = await tw.txHandled(txid+"#"+eventName)
	console.log(`isHandled: ${isHandled}`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});