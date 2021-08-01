// import { DeployFunction } from "hardhat-deploy/dist/types";
import { DeployFunction } from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {ERC20} from '../src/types/ERC20'
import {PegSwapPair} from '../src/types/PegSwapPair'
import {PegSwap} from '../src/types/PegSwap'
import {TwoWay} from '../src/types/TwoWay'
import {TwoWayFeePool} from '../src/types/TwoWayFeePool'
import { ethers } from "ethers";
import {attach} from '../scripts/helper'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts} = hre;	
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const result = await deploy('TestERC20USDT', {
		from: deployer,
		contract: 'TestERC20',
		args: ['TestERC20', 'USDT', 6],
		log: true
	})
	const usdtAddr = result.address

	const pairResult = await deploy('PegSwapPairUSDT', {
		from: deployer,
		contract: 'PegSwapPair',
		args: ['TwoWay LP', 'TLP'],
		log: true
	})
	const pairAddr = pairResult.address

	const swapResult = await deploy('PegSwap', {
		from: deployer,
		contract: 'PegSwap',
		log: true
	})
	const swapAddr = swapResult.address

	const twoWayResult = await deploy('TwoWay', {
		from: deployer,
		log: true
	})

	const feePoolResult = await deploy('TwoWayFeePool', {
		from: deployer,
		args: [pairAddr, usdtAddr, twoWayResult.address],
		log:  true
	})

	const usdt = (await attach("TestERC20", usdtAddr)) as ERC20
	const twoWay = (await attach("TwoWay", twoWayResult.address)) as TwoWay
	const pegSwap = (await attach('PegSwap', swapAddr)) as PegSwap
	const PegSwapPair = (await attach('PegSwapPair', pairAddr)) as PegSwapPair
	const feePool = (await attach('TwoWayFeePool', feePoolResult.address)) as TwoWayFeePool
	await setting(usdt, twoWay, pegSwap, PegSwapPair, feePool, 65)
}

async function setting(usdt: ERC20, tw: TwoWay, pegSwap: PegSwap, pegSwapPair: PegSwapPair, feePool: TwoWayFeePool, chainID: number) {
	await pegSwap.setTwoWay(tw.address)
	await pegSwap.addPair(usdt.address, pegSwapPair.address, chainID)

	// TwoWay
	await tw.setPegSwap(pegSwap.address)
	await tw.addFeeTo(usdt.address, chainID, feePool.address)
	await tw.setThreshold(usdt.address, 1)
	await tw.setFee(usdt.address, chainID, ethers.utils.parseUnits("1", 6), ethers.utils.parseEther('0.003'))
}

export default func;
func.tags = ['tw00']