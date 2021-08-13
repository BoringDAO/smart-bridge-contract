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
	boringUSDT: BoringToken,
	tw: TwoWay,
	swapPair: SwapPair, 
	chainID: number, 
	token0: string, 
	token1: string, 
	crosser: string,
	fixFee: string,
	ratioFee: string,
	removeFee: string
	) {
	// TwoWay
	const tx = await tw.addPair(usdt.address, swapPair.address, chainID)
	console.log(`tx addPair ${tx.hash}`)
	await tx.wait()

	let token0Decimals = await usdt.decimals()
	const tx2 = await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits(fixFee, token0Decimals), ethers.utils.parseEther(ratioFee))
	console.log(`tx setFee ${tx2.hash}`)
	await tx2.wait()

	const tx3 = await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits(removeFee, token0Decimals))
	console.log(`tx setRemoveFee ${tx3.hash}`)
	await tx3.wait()

	const tx4 = await tw.setThreshold(usdt.address, 1)
	console.log(`tx setThreshold ${tx4.hash}`)
	await tx4.wait()

	const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	console.log(`tx grantRole ${tx5.hash}`)
	await tx5.wait()

	const tx6 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER_ROLE"), swapPair.address)
	console.log(`tx grantRole ${tx6.hash}`)
	await tx6.wait()

	const tx7 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER_ROLE"), swapPair.address)
	console.log(`tx grantRole ${tx7.hash}`)
	await tx7.wait()

	const tx8 = await swapPair.setTwoWay(tw.address)
	console.log(`tx setTwoWay ${tx8.hash}`)
	await tx8.wait()

	const tx9 = await tw.addSupportToken(token0, token1, chainID)
	console.log(`tx addSupportToken ${tx9.hash}`)
	await tx9.wait()

}