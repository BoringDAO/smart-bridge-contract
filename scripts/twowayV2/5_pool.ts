import { parseEther } from "ethers/lib/utils"
import { utimes } from "fs"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { ERC20 } from "../../src/types/ERC20"
import { NBridge } from "../../src/types/NBridge"
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { TwoWayChef } from "../../src/types/TwoWayChef"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	let dispatcher = accounts[0]

	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["matic_test"]
	let contracts = JSON.parse(getContractsAddress())
	let boringSymbol = "BORING"
	let feeRewardSymbol = "oUSDT"
	let dispatcherAddr = await accounts[0].getAddress()
	let rewardPerSec = ethers.utils.parseEther("1")
	let startTS = 1000000

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
		let twAddr = contracts[chainid.toString()]['TwoWayV2'];
		console.log(`twAddr ${twAddr}`)
		let tw = await attach("TwoWayCenter", twAddr) as TwoWayCenter

		let feeRewardTokenAddr = contracts[chainIdStr][feeRewardSymbol]
		let boringAddr = contracts[chainIdStr][boringSymbol]

		// deploy chef
		let chef = await deployProxy<TwoWayChef>("TwoWayChef", boringAddr, dispatcherAddr, rewardPerSec, startTS)
		let txAddPool = await chef.addPool(100, feeRewardTokenAddr, true)
		console.log(`tx add Pool ${txAddPool.hash}`)
		await txAddPool.wait()

		// approve for chef
		let boring = await attach("ERC20", boringAddr) as ERC20
		let txApprove = await boring.approve(chef.address, ethers.utils.parseEther("10000000"))
		console.log(`txApprove ${txApprove.hash}`)
		await txApprove.wait()

		// deploy staking reward
		let sr = await deploy("StakingReward", chef.address, feeRewardTokenAddr, 0)

		// chef setting of sr
		let txSetSR = await chef.setStakingReward(0, sr.address)
		console.log(`txSetSR ${txSetSR.hash}`)
		await txSetSR.wait()

		contracts[chainIdStr]["TwoWayChef"] = chef.address
		contracts[chainIdStr]["StakingRewardForChef"] = sr.address

		// twowayCenter setting of sr
		let txSetSRTW = await tw.setStakingReward(sr.address)
		console.log(`tx set SR for twoway ${txSetSRTW.hash}`)
		await txSetSRTW.wait()

		writeContractAddress(JSON.stringify(contracts))
	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});