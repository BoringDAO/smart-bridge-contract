// import { DeployFunction } from "hardhat-deploy/dist/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ERC20 } from '../src/types/ERC20'
import { SwapPair } from '../src/types/SwapPair'
import { TwoWay } from '../src/types/TwoWay'
import { TwoWayFeePool } from '../src/types/TwoWayFeePool'
import { BoringToken } from '../src/types/BoringToken'
import { ethers } from "ethers";
import { attach } from '../scripts/helper'
import { network } from 'hardhat'

let feeToDev: string;
let crosser = "0xc38068d89b16a1dae117974f30230f4afd654b3c"
const BSC_chainid = 97
const OKEX_chainid = 65

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();
	feeToDev = deployer

	// let decimals = 18
	// const result = await deploy('TestERC20USDT', {
	// 	from: deployer,
	// 	contract: 'TestERC20',
	// 	args: ['TestERC20', 'USDT', 18],
	// 	log: true
	// })
	// const usdtAddr = result.address
	// process.exit(0)

	let usdtAddr;
	let decimals;
	if (network.name === "bsc_test") {
		usdtAddr = "0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015"
		decimals = 18
	} else if (network.name === "okex_test") {
		usdtAddr = "0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB"
		decimals = 18
	} else if (network.name === "bsc") {
		usdtAddr = '0x55d398326f99059ff775485246999027b3197955'
		decimals = 18
	} else if (network.name === 'okex') {
		usdtAddr = '0x382bB369d343125BfB2117af9c149795C6C65C50'
		decimals = 18
	}else {
		console.error("not known network")
		process.exit(1)
	}

	const boringUSDTResult = await deploy('BoringToken', {
		from: deployer,
		args: ['boirngUSDT', 'boringUSDT', decimals],
		log: true
	})
	const boringUSDTAddr = boringUSDTResult.address

	const pairResult = await deploy('SwapPairUSDT', {
		from: deployer,
		contract: 'SwapPair',
		args: ['TwoWay LP', 'TLP', decimals, usdtAddr, boringUSDTAddr],
		log: true
	})
	const pairAddr = pairResult.address

	const twoWayResult = await deploy('TwoWay', {
		from: deployer,
		args: [deployer],
		log: true
	})

	// const feePoolResult = await deploy('TwoWayFeePool', {
	// 	from: deployer,
	// 	args: [pairAddr, usdtAddr, twoWayResult.address, decimals],
	// 	log: true
	// })

	const usdt = (await attach("TestERC20", usdtAddr)) as ERC20
	const twoWay = (await attach("TwoWay", twoWayResult.address)) as TwoWay
	const swapPair = (await attach('SwapPair', pairAddr)) as SwapPair
	// const feePool = (await attach('TwoWayFeePool', feePoolResult.address)) as TwoWayFeePool
	const boringUSDT = (await attach('BoringToken', boringUSDTAddr)) as BoringToken

	// await setting(usdt, boringUSDT, twoWay, swapPair, OKEX_chainid)
	// await setting(usdt, boringUSDT, twoWay, swapPair, BSC_chainid)

	// await addSupportToken(twoWay, usdtAddr, OKEX_chainid, "0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB")
	// await addSupportToken(twoWay, usdtAddr, BSC_chainid, "0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015")

	// await crossOut(usdt, twoWay)
}

async function addSupportToken(tw: TwoWay, token0: string, chainID: number, token1: string) {
	const tx = await tw.addSupportToken(token0, token1, chainID)	
	await tx.wait()
}

async function crossOut(usdt: ERC20, twoWay: TwoWay) {
	const amount = ethers.utils.parseUnits("10000", 6)
	const result = await twoWay.calculateFee(usdt.address, OKEX_chainid, amount)
	const out = await twoWay.getMaxToken1AmountOut(usdt.address, OKEX_chainid)
	// console.log(results.map(data => {ethers.utils.formatUnits(data, 6)}))
	console.log(ethers.utils.formatUnits(result.remainAmount, 6))
	console.log(`max out ${ethers.utils.formatUnits(out, 6)}`)

	const feeTo = await twoWay.feeTo(usdt.address, OKEX_chainid)
	console.log(`feeTo ${feeTo}`)

	const feePoolAddr = await twoWay.twoWayFeePool()
	console.log(`fee Pool addr ${feePoolAddr}`)

	const thre = await twoWay.threshold(usdt.address)
	console.log(`thre is ${thre}`)

	process.exit(0)

	let tx0 = await usdt.approve(twoWay.address, ethers.constants.MaxUint256)	
	await tx0.wait()
	// let tx1 = await twoWay.crossOut(usdt.address, BSC_chainid, feeToDev, ethers.utils.parseUnits("10000", 6))
	let tx1 = await twoWay.crossOut(usdt.address, OKEX_chainid, "0xF15F3CE67D07ab9983Fa29142855c51608252A84", ethers.utils.parseUnits("150000", 6))
	await tx1.wait()
}

async function setting(usdt: ERC20, boringUSDT: BoringToken, tw: TwoWay, swapPair: SwapPair, chainID: number) {
	// TwoWay
	const tx = await tw.addPair(usdt.address, swapPair.address, chainID)
	await tx.wait()

	const tx2 = await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 6), ethers.utils.parseEther('0.003'))
	await tx2.wait()
	
	const tx3 = await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits("0.5", 6))
	await tx3.wait()

	const tx4 = await tw.setThreshold(usdt.address, 1)
	await tx4.wait()
	
	const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	await tx5.wait()

	const tx6 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER_ROLE"), swapPair.address)
	await tx6.wait()

	const tx7 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER_ROLE"), swapPair.address)
	await tx7.wait()

	const tx8 = await swapPair.setTwoWay(tw.address)
	await tx8.wait()
	
}

export default func;
func.tags = ['tw00']