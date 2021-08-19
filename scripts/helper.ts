import { BigNumber, BigNumberish, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { BigNumber as RawBigNumber } from "bignumber.js"

import { ethers } from "hardhat";
import { ERC20 } from "../src/types/ERC20";
import { BoringToken } from "../src/types/BoringToken";
import { TwoWay } from "../src/types/TwoWay";
import { SwapPair } from "../src/types/SwapPair";

export async function deploy(name: string, ...params: any[]) {
	const contractFactory = await ethers.getContractFactory(name);
	const con = await contractFactory.deploy(...params)
	await con.deployed()
	console.log(`${name}: ${con.address}`)
	return con
}

export async function attach(name: string, addr: string) {
	return await ethers.getContractAt(name, addr)
}

export async function setTwoWay(usdt: ERC20,
	tw: TwoWay,
	swapPair: SwapPair,
	chainIDs: number[],
	token0: string,
	token1s: string[],
	crosser: string,
	fixFee: string,
	ratioFee: string,
	removeFee: string
) {
	
	const tx8 = await swapPair.setTwoWay(tw.address)
	console.log(`tx setTwoWay ${tx8.hash}`)
	await tx8.wait()
	// TwoWay
	const tx = await tw.addPair(usdt.address, swapPair.address, chainIDs)
	console.log(`tx addPair ${tx.hash}`)
	await tx.wait()

	let token0Decimals = await usdt.decimals()
	for (let i = 0; i < chainIDs.length; i++) {
		const tx2 = await tw.setFee(usdt.address, chainIDs[i], ethers.utils.parseUnits(fixFee, token0Decimals), ethers.utils.parseEther(ratioFee))
		console.log(`tx setFee ${tx2.hash}`)
		await tx2.wait()
	}

	const tx3 = await tw.setRemoveFee(usdt.address, ethers.utils.parseUnits(removeFee, token0Decimals))
	console.log(`tx setRemoveFee ${tx3.hash}`)
	await tx3.wait()

	const tx4 = await tw.setThreshold(usdt.address, 1)
	console.log(`tx setThreshold ${tx4.hash}`)
	await tx4.wait()

	const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	console.log(`tx grantRole ${tx5.hash}`)
	await tx5.wait()


	for (let i = 0; i < token1s.length; i++) {
		const tx9 = await tw.addSupportToken(token0, token1s[i], chainIDs[i])
		console.log(`tx addSupportToken ${tx9.hash}`)
		await tx9.wait()
	}

}