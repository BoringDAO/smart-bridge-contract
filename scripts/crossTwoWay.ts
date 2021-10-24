import { parseUnits } from "@ethersproject/units"
import { ethers } from "hardhat"
import { ERC20 } from "../src/types/ERC20"
import { TwoWay } from "../src/types/TwoWay"

// cross 1000 usdt, BSC -> fantom
async function main() {
	// decimal is 18
	let usdt_bsc_addr = "0x55d398326f99059ff775485246999027b3197955"
	let usdt_fantom_addr = "0x049d68029688eabf473097a2fc38ef61633a3c7a"
	let twoWay_bsc_addr = "0xf52D6823D9e2aff7548D9Fe82eeadCA6b1ED3062"
	let twoWay_fantom_addr = "0xbE4A5438ad89311d8c67882175D0fFcC65Dc9C03"
	let crossTo = "0x67Ee188Ee1319CDAc271553e7b8FAAed2fBC52CC"
	let bsc_chainid = 56
	let fantom_chainid = 250
	let crossAmount = "1000"

	// first approve usdt to TwoWay on bsc network
	let usdt_bsc = await ethers.getContractAt("ERC20", usdt_bsc_addr) as ERC20
	let twoway_bsc = await ethers.getContractAt("TwoWay", twoWay_bsc_addr) as TwoWay
	// or ethers.constants.MaxUint256
	await usdt_bsc.approve(twoWay_bsc_addr, parseUnits(crossAmount, 18))

	// Second, get max cross amount from bsc to fantom
	let liquidityFantomForBSC = await twoway_bsc.getMaxToken1AmountOut(usdt_bsc_addr, fantom_chainid)
	// change network to fantom
	let twoway_fantom = await ethers.getContractAt("TwoWay", twoWay_fantom_addr) as TwoWay
	let liquidity = await twoway_fantom.getMaxToken0AmountOut(usdt_fantom_addr, fantom_chainid)
	let maxAmountToFantom = liquidityFantomForBSC.add(liquidityFantomForBSC)

	// get fees
	




}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});