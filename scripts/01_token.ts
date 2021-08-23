import { run, ethers, network } from "hardhat";
import { attach, deploy } from "./helper";
import { TestERC20 } from '../src/types/TestERC20'

async function main() {
	await run("compile");
	const accounts = await ethers.getSigners();

	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	switch (network.name) {
		case 'okex_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
			break
		case 'bsc_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
			break
		case 'kovan':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'avax_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'okex':
			break
		case 'bsc':
			break
		default:
			console.error(`Not known network ${network.name}`)
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});