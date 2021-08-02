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

	const pairResult = await deploy('PegSwapPairUSDT', {
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
	const PegSwapPair = (await attach('PegSwapPair', pairAddr)) as SwapPair
	const feePool = (await attach('TwoWayFeePool', feePoolResult.address)) as TwoWayFeePool
	const boringUSDT = (await attach('BoringToken', boringUSDTAddr)) as BoringToken
	await setting(usdt, boringUSDT, twoWay, PegSwapPair, feePool, 65)
}

async function setting(usdt: ERC20, boringUSDT: BoringToken, tw: TwoWay, swapPair: SwapPair, feePool: TwoWayFeePool, chainID: number) {
	// TwoWay
	await tw.addPair(usdt.address, swapPair.address, chainID)

	await tw.setFeeTo(usdt.address, chainID, feePool.address)
	// await tw.setFeeToDev(feeToDev)
	await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 6), ethers.utils.parseEther('0.003'))
	await tw.setRemoveFee(usdt.address, chainID, ethers.utils.parseUnits("0.5", 6))

	await tw.setThreshold(usdt.address, 1)

	await boringUSDT.grantRole(ethers.utils.formatBytes32String("MINTER"), tw.address)
	await boringUSDT.grantRole(ethers.utils.formatBytes32String("BURNER"), tw.address)

	await swapPair.setTwoWay(tw.address)
	
}

export default func;
func.tags = ['tw00']