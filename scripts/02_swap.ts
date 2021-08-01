import { run, ethers, network } from "hardhat";
import { attach, deploy } from "./helper";
import { TestERC20 } from '../typechain/TestERC20'
import { TwoWay } from '../typechain/TwoWay'
import { PegSwapPair } from '../src/types/PegSwapPair'
import { PegSwap } from '../src/types/PegSwap'

async function deployPegSwapPair(networkName: string): Promise<PegSwapPair> {
	if(process.env.PegSwapPair) {
		return (await attach("PegSwapPair", process.env.PegSwapPair)) as PegSwapPair
	}
	const pair = await deploy("PegSwapPair", "TwoWay LP", "TLP-USDT") as PegSwapPair
	process.env['PegSwapPair_'+networkName] = pair.address
	console.log(`PegSwapPair deploy at ${pair.address}`)
	return pair
}

async function deployPegSwap(networkName: string): Promise<PegSwap> {
	if(process.env.PegSwap) {
		return (await attach("PegSwap", process.env.PegSwap)) as PegSwap
	}
	const swap = await deploy("PegSwap", "TwoWay LP", "TLP-USDT") as PegSwap
	process.env['PegSwap_'+networkName] = swap.address
	console.log(`PegSwap deploy at ${swap.address}`)
	return swap
}

async function main() {
	await run("compile");
	const accounts = await ethers.getSigners();

	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	switch (network.name) {
		case 'okex_test':
			await deployPegSwapPair(network.name)
			await deployPegSwap(network.name)
			break
		case 'bsc_test':
			await deployPegSwapPair(network.name)
			await deployPegSwap(network.name)
			break
		case 'okex':
			break
		case 'bsc':
			break
		default:
			console.error("Not known network")
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});