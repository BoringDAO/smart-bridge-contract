import { run, ethers, network } from "hardhat";
import { attach, deploy } from "./helper";
import { TestERC20 } from '../src/types/TestERC20'

async function main() {
	const accounts = await ethers.getSigners();

	const usdt = await ethers.getContractAt("TestERC20", "0xd6F3C2A963e15Ee5A1ac54e989c27614573C74EB") as TestERC20
	await usdt.transfer("0x60E76dC9B7369293B364186EcCad993dE205d228", ethers.utils.parseUnits("100000", 6))
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});