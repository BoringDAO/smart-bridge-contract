import { ethers } from "hardhat"
import { deploy } from '../scripts/helper'
import { ERC20 } from '../src/types/ERC20'
import { BoringToken } from '../src/types/BoringToken'
import { SwapPair } from '../src/types/SwapPair'
import { TwoWay } from '../src/types/TwoWay'
import {Signer} from 'ethers'
import { formatEther, parseEther } from "ethers/lib/utils"
import { use } from "chai"

async function setting(usdt: ERC20, boringUSDT: BoringToken, tw: TwoWay, swapPair: SwapPair, chainID: number) {
	// TwoWay
	const tx = await tw.addPair(usdt.address, swapPair.address, chainID)
	await tx.wait()

	const tx2 = await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 18), ethers.utils.parseEther('0.003'))
	await tx2.wait()
	
	const tx3 = await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits("0.5", 18))
	await tx3.wait()

	const tx4 = await tw.setThreshold(usdt.address, 1)
	await tx4.wait()
	
	const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), '0x2353178C6c05378812f024A783541857634A1e82')
	await tx5.wait()

	const tx6 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER_ROLE"), swapPair.address)
	await tx6.wait()

	const tx7 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER_ROLE"), swapPair.address)
	await tx7.wait()

	const tx8 = await swapPair.setTwoWay(tw.address)
	await tx8.wait()
	
}

async function status(pair: SwapPair, tw: TwoWay, usdt: ERC20, user: string) {
	const [r0, r1] = await pair.getReserves()	
	console.log('r0', formatEther(r0), 'r1', formatEther(r1))
	const usdtBal = await usdt.balanceOf(user)
	console.log(`user ${user} has ${formatEther(usdtBal)} usdt`)
	const lpBalance = await pair.balanceOf(user)
	console.log(`user ${user} has ${formatEther(lpBalance)} lp`)
}

describe("TwoWay", () => {
	let accounts: Signer[]
	let deployerAddr: string
	before(async () =>{
		accounts = await ethers.getSigners()
		deployerAddr = await accounts[0].getAddress()
	})

	describe("liquidity", () => {
		let usdt: ERC20
		let boringUSDT: BoringToken
		let swapPair: SwapPair
		let tw: TwoWay

		beforeEach(async () => {
			usdt = await deploy("TestERC20", "TestERC20", 'USDT', 18) as ERC20
			boringUSDT = await deploy("BoringToken", "boringUSDT", "boringUSDT", 18) as BoringToken	
			swapPair = await deploy("SwapPair", "TwoWay LP", "TLP", 18, usdt.address, boringUSDT.address) as SwapPair
			tw = await deploy("TwoWay", deployerAddr) as TwoWay
			await setting(usdt, boringUSDT, tw, swapPair, 11)
			await tw.addSupportToken(usdt.address, '0x2353178C6c05378812f024A783541857634A1e82', 11)
			await usdt.approve(tw.address, ethers.constants.MaxUint256)
			await swapPair.approve(tw.address, ethers.constants.MaxUint256)
		})

		it("add Liquidity", async () => {
			await status(swapPair, tw, usdt, deployerAddr)
			await tw.addLiquidity(usdt.address, 11, parseEther("1000"), deployerAddr)
			await status(swapPair, tw, usdt, deployerAddr)
			await tw.addLiquidity(usdt.address, 11, parseEther("500"), deployerAddr)
			await status(swapPair, tw, usdt, deployerAddr)
			await tw.removeLiquidity(usdt.address, 11, parseEther('200'), deployerAddr)
			await status(swapPair, tw, usdt, deployerAddr)
		})

		it('crossOut', async () => {
			await tw.crossOut(usdt.address, 11, deployerAddr, parseEther('300'))
		})
	})
})