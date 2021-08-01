import { run, ethers, network } from "hardhat";
import { attach, deploy } from "./helper";
import { TestERC20 } from '../typechain/TestERC20'
import {TwoWay} from '../typechain/TwoWay'

async function main() {
	await run("compile");
	const accounts = await ethers.getSigners();

	const usdtBSCAddr = ""
	const usdtOkexAddr = ""

	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let twoWay: TwoWay
	switch (network.name) {
		case 'okex_test':
			twoWay = await deploy("TwoWay") as TwoWay 
			break
		case 'bsc_test':
			twoWay = await deploy("TwoWay") as TwoWay 
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