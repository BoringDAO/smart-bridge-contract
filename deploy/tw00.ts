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
import { formatEther } from "ethers/lib/utils";

let feeToDev: string;
// let crosser = "0xc38068d89b16a1dae117974f30230f4afd654b3c"
let crosser = "0xF15F3CE67D07ab9983Fa29142855c51608252A84"
let BSC_CHAINID: number;
let OKEX_CHAINID: number;

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
	// let usdtAddr = result.address
	// process.exit(0)

	let usdtAddr;
	let decimals;
	let usdtBSCMain = '0x55d398326f99059ff775485246999027b3197955'
	let usdtOkexMain = '0x382bB369d343125BfB2117af9c149795C6C65C50'
	if (network.name === "bsc_test") {
		usdtAddr = "0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015"
		decimals = 18
		BSC_CHAINID = 97
		OKEX_CHAINID = 65
	} else if (network.name === "okex_test") {
		usdtAddr = "0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB"
		decimals = 18
		BSC_CHAINID = 97
		OKEX_CHAINID = 65
	} else if (network.name === "bsc") {
		usdtAddr = '0x55d398326f99059ff775485246999027b3197955'
		decimals = 18
		feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
		BSC_CHAINID = 56
		OKEX_CHAINID = 66
		crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
	} else if (network.name === 'okex') {
		usdtAddr = '0x382bB369d343125BfB2117af9c149795C6C65C50'
		decimals = 18
		feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
		BSC_CHAINID = 56
		OKEX_CHAINID = 66
		crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
	} else if (network.name === 'hardhat') {
		usdtAddr = "0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015"
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

	const usdt = (await attach("TestERC20", usdtAddr)) as ERC20
	const twoWay = (await attach("TwoWay", twoWayResult.address)) as TwoWay
	const swapPair = (await attach('SwapPair', pairAddr)) as SwapPair
	const boringUSDT = (await attach('BoringToken', boringUSDTAddr)) as BoringToken

	// if (network.name === "bsc_test") {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, OKEX_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, OKEX_CHAINID, "0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB")
	// 	await supportToken(twoWay, usdt, OKEX_CHAINID)
	// } else if (network.name === "okex_test") {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, BSC_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, BSC_CHAINID, "0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015")
	// 	await supportToken(twoWay, usdt, BSC_CHAINID)
	// } else if (network.name === "bsc") {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, OKEX_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, OKEX_CHAINID, usdtOkexMain)
	// 	await supportToken(twoWay, usdt, OKEX_CHAINID)
	// } else if (network.name === 'okex') {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, BSC_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, BSC_CHAINID, usdtBSCMain)
	// 	await supportToken(twoWay, usdt, BSC_CHAINID)
	// } else if (network.name === 'hardhat') {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, OKEX_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, BSC_CHAINID, "0x55d398326f99059ff775485246999027b3197955")
	// 	await supportToken(twoWay, usdt, BSC_CHAINID)
	// } else if (network.name === 't1') {
	// 	await setting(usdt, boringUSDT, twoWay, swapPair, OKEX_CHAINID)
	// 	await addSupportToken(twoWay, usdtAddr, OKEX_CHAINID, "0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB")
	// 	await supportToken(twoWay, usdt, OKEX_CHAINID)
	// } else if (network.name === 't2') {

	// }else {
	// 	console.error("not known network")
	// 	process.exit(1)
	// }

	// await supportToken(twoWay, usdt, BSC_CHAINID)
	// await status(swapPair, twoWay, usdt, deployer)
	// await supportToken(twoWay, usdt, OKEX_CHAINID)
	// await crossOut(usdt, twoWay, BSC_CHAINID)

	// await check(swapPair, boringUSDT)
	// await calculateBurn(swapPair)

	// await setFee(twoWay, usdt, OKEX_CHAINID)

}

async function check(pair: SwapPair, boringUSDT: BoringToken) {
	let token0 =await pair.token0()	
	let token1 = await pair.token1()
	console.log(`token0 ${token0}, token1 ${token1}`)

	let hasRole = await boringUSDT.hasRole(ethers.utils.formatBytes32String('BURNER_ROLE'), pair.address)
	console.log(`hasRole ${hasRole}`)

	const bal = await boringUSDT.balanceOf(pair.address)
	console.log(`boringUSDT bal of pair ${formatEther(bal)}`)
}

async function addSupportToken(tw: TwoWay, token0: string, chainID: number, token1: string) {
	const tx = await tw.addSupportToken(token0, token1, chainID)	
	await tx.wait()
}

async function supportToken(tw: TwoWay, usdt: ERC20, chainid: number) {
	const addr = await tw.supportToken(usdt.address, chainid)	
	console.log(`twoWay ${tw.address} usdt0 ${usdt.address}  chainID ${chainid} support token ${addr}`)

	const pair = await tw.pairs(usdt.address, chainid)
	console.log(`pair ${pair}`)
}

async function status(pair: SwapPair, tw: TwoWay, usdt: ERC20, user: string) {
	const [r0, r1] = await pair.getReserves()	
	console.log('r0', formatEther(r0), 'r1', formatEther(r1))
	const usdtBal = await usdt.balanceOf(user)
	console.log(`user ${user} has ${formatEther(usdtBal)} usdt`)
	const lpBalance = await pair.balanceOf(user)
	console.log(`user ${user} has ${formatEther(lpBalance)} lp`)
}

async function crossOut(usdt: ERC20, twoWay: TwoWay, chainid: number) {
	// const amount = ethers.utils.parseUnits("10000", 18)
	// const result = await twoWay.calculateFee(usdt.address, OKEX_CHAINID, amount)
	// const out = await twoWay.getMaxToken1AmountOut(usdt.address, OKEX_CHAINID)
	// // console.log(results.map(data => {ethers.utils.formatUnits(data, 6)}))
	// console.log(ethers.utils.formatUnits(result.remainAmount, 18))
	// console.log(`max out ${ethers.utils.formatUnits(out, 18)}`)

	// const feeTo = await twoWay.feeTo(usdt.address, OKEX_CHAINID)
	// console.log(`feeTo ${feeTo}`)

	// const feePoolAddr = await twoWay.twoWayFeePool()
	// console.log(`fee Pool addr ${feePoolAddr}`)

	// const thre = await twoWay.threshold(usdt.address)
	// console.log(`thre is ${thre}`)

	// process.exit(0)
	// const out1 = await twoWay.getMaxToken1AmountOut(usdt.address, OKEX_CHAINID)
	// console.log(`out1 ${formatEther(out1)}`)

	// let tx0 = await usdt.approve(twoWay.address, ethers.constants.MaxUint256)	
	// await tx0.wait()
	// let txLiqui = await twoWay.addLiquidity(usdt.address, OKEX_CHAINID, ethers.utils.parseEther("1000"), "0xF15F3CE67D07ab9983Fa29142855c51608252A84")
	// await txLiqui.wait()
	let tx1 = await twoWay.crossOut(usdt.address, chainid, "0xF15F3CE67D07ab9983Fa29142855c51608252A84", ethers.utils.parseUnits("2000", 18))
	await tx1.wait()
}

async function calculateBurn(swapPair:SwapPair) {
	const [a0, a1] = await swapPair.calculateBurn(ethers.utils.parseEther("100"))	
	console.log(`a0 ${ethers.utils.formatEther(a0)}, a1 ${ethers.utils.formatEther(a1)}`)
}

async function setFee(twoWay: TwoWay, usdt: ERC20, chainID: number) {
	const tx2 = await twoWay.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 18), ethers.utils.parseEther('0.003'))
	await tx2.wait()
}

async function setting(usdt: ERC20, boringUSDT: BoringToken, tw: TwoWay, swapPair: SwapPair, chainID: number) {
	// TwoWay
	// const tx = await tw.addPair(usdt.address, swapPair.address, chainID)
	// await tx.wait()

	// const tx2 = await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 18), ethers.utils.parseEther('0.003'))
	// await tx2.wait()
	
	// const tx3 = await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits("0", 18))
	// await tx3.wait()

	// const tx4 = await tw.setThreshold(usdt.address, 1)
	// await tx4.wait()
	
	// const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	// await tx5.wait()

	// const tx6 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER_ROLE"), swapPair.address)
	// await tx6.wait()

	const tx7 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER_ROLE"), swapPair.address)
	await tx7.wait()

	const tx8 = await swapPair.setTwoWay(tw.address)
	await tx8.wait()
	
}

export default func;
func.tags = ['tw00']