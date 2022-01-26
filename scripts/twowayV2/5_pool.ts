import { parseEther } from "ethers/lib/utils"
import { utimes } from "fs"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { ERC20 } from "../../src/types/ERC20"
import { NBridge } from "../../src/types/NBridge"
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { TwoWayChef } from "../../src/types/TwoWayChef"
import { StakingReward } from "../../src/types/StakingReward"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper"

const hre = require("hardhat")

async function main() {

	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["matic"]
	let contracts = JSON.parse(getContractsAddress())
	let boringSymbol = "BORING"
	let feeRewardSymbol = "oFIN"
	let rewardPerSec = ethers.utils.parseEther("0.0003")
	let startTS = Math.round(Date.now() / 1000)
	let pid = 4
	let pool_point = 0
	console.log(`startTS ${startTS}`)

	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}

	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let accounts = await ethers.getSigners()
		console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
		let dispatcherAddr = await accounts[0].getAddress()
		let chainid = network.config.chainId!
		let chainIdStr = network.config.chainId!.toString()
		console.log(`network name ${network.name} ${network.config.chainId!}`)
		// let tw: TwoWayCenter|TwoWayEdge
		let twAddr = contracts[chainid.toString()]['TwoWayV2'];
		console.log(`twAddr ${twAddr}`)
		let tw = await attach("TwoWayCenter", twAddr) as TwoWayCenter

		let feeRewardTokenAddr = contracts[chainIdStr][feeRewardSymbol]
		let boringAddr = contracts[chainIdStr][boringSymbol]

		let chef
		if (contracts[chainIdStr]["TwoWayChef"] == undefined) {

			// deploy chef
			chef = await deployProxy<TwoWayChef>("TwoWayChef", boringAddr, dispatcherAddr, rewardPerSec, startTS)

			// approve for chef
			let boring = await attach("ERC20", boringAddr) as ERC20
			let txApprove = await boring.approve(chef.address, ethers.utils.parseEther("10000000"))
			console.log(`txApprove ${txApprove.hash}`)
			await txApprove.wait()
		} else {
			chef = await ethers.getContractAt("TwoWayChef", contracts[chainIdStr]["TwoWayChef"]) as TwoWayChef
		}
		console.log(`TwoWayChef ${chef.address}`)
		let poolLength = await chef.poolLength()
		console.log(`pool length ${poolLength}`)

		// return


		let txAddPool = await chef.addPool(pool_point, feeRewardTokenAddr, true)
		console.log(`tx add Pool ${txAddPool.hash}`)
		await txAddPool.wait()


		// deploy staking reward
		let sr = await deployProxy<StakingReward>("StakingReward", feeRewardTokenAddr, chef.address, pid)

		let chefRoleKey = await sr.CHEF_ROLE()
		let txGrantChefRole = await sr.grantRole(chefRoleKey, chef.address)
		console.log(`txGrantChefRole ${txGrantChefRole.hash}`)
		await txGrantChefRole.wait()

		let centerRoleKey = await sr.CENTER_ROLE()
		let txCenterRoleKey = await sr.grantRole(centerRoleKey, tw.address)
		console.log(`txCenterRoleKey ${txCenterRoleKey.hash}`)
		await txCenterRoleKey.wait()

		// chef setting of sr
		let txSetSR = await chef.setStakingReward(pid, sr.address)
		console.log(`txSetSR ${txSetSR.hash}`)
		await txSetSR.wait()

		// contracts[chainIdStr]["TwoWayChef"] = chef.address
		contracts[chainIdStr]["StakingRewardForChef"+feeRewardSymbol] = sr.address

		// twowayCenter setting of sr
		let txSetSRTW = await tw.setStakingRewards([feeRewardTokenAddr], [sr.address])
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