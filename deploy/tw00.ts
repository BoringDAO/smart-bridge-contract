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

let feeToDev;
let crosser = "0xc38068d89b16a1dae117974f30230f4afd654b3c"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;

	const { deployer } = await getNamedAccounts();
	feeToDev = deployer
	const result = await deploy('TestERC20USDT', {
		from: deployer,
		contract: 'TestERC20',
		args: ['TestERC20', 'USDT', 6],
		log: true
	})
	const usdtAddr = result.address

	const boringUSDTResult = await deploy('BoringToken', {
		from: deployer,
		args: ['boirngUSDT', 'boringUSDT', 6],
		log: true
	})
	const boringUSDTAddr = boringUSDTResult.address

	const pairResult = await deploy('SwapPairUSDT', {
		from: deployer,
		contract: 'SwapPair',
		args: ['TwoWay LP', 'TLP', 6, usdtAddr, boringUSDTAddr],
		log: true
	})
	const pairAddr = pairResult.address

	const twoWayResult = await deploy('TwoWay', {
		from: deployer,
		args: [deployer],
		log: true
	})

	const feePoolResult = await deploy('TwoWayFeePool', {
		from: deployer,
		args: [pairAddr, usdtAddr, twoWayResult.address],
		log: true
	})

	const usdt = (await attach("TestERC20", usdtAddr)) as ERC20
	const twoWay = (await attach("TwoWay", twoWayResult.address)) as TwoWay
	const swapPair = (await attach('SwapPair', pairAddr)) as SwapPair
	const feePool = (await attach('TwoWayFeePool', feePoolResult.address)) as TwoWayFeePool
	const boringUSDT = (await attach('BoringToken', boringUSDTAddr)) as BoringToken
	
	// await setting(usdt, boringUSDT, twoWay, swapPair, feePool, 65)
	// await setting(usdt, boringUSDT, twoWay, swapPair, feePool, 97)

	// await addSupportToken(twoWay, usdtAddr, 65, "0x1Da3F386115fD780Aa9A928B1965dE6a7514EAE8")
	await addSupportToken(twoWay, usdtAddr, 97, "0xd6F3C2A963e15Ee5A1ac54e989c27614573C74EB")
}

async function addSupportToken(tw: TwoWay, token0: string, chainID: number, token1: string) {
	const tx = await tw.addSupportToken(token0, token1, chainID)	
	await tx.wait()
}

async function setting(usdt: ERC20, boringUSDT: BoringToken, tw: TwoWay, swapPair: SwapPair, feePool: TwoWayFeePool, chainID: number) {
	// TwoWay
	const tx = await tw.addPair(usdt.address, swapPair.address, chainID)
	await tx.wait()

	const tx1 = await tw.setFeeTo(usdt.address, chainID, feePool.address)
	await tx1.wait()
	// await tw.setFeeToDev(feeToDev)
	const tx2 = await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 6), ethers.utils.parseEther('0.003'))
	await tx2.wait()
	
	const tx3 = await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits("0.5", 6))
	await tx3.wait()

	const tx4 = await tw.setThreshold(usdt.address, 1)
	await tx4.wait()
	
	const tx5 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	await tx5.wait()

	const tx6 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER_ROLE"), tw.address)
	await tx6.wait()

	const tx7 = await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER_ROLE"), tw.address)
	await tx7.wait()

	const tx8 = await swapPair.setTwoWay(tw.address)
	await tx8.wait()
	
}

export default func;
func.tags = ['tw00']