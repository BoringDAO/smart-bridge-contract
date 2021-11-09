import { BigNumberish } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { parse } from "path/posix";
import { NBridge } from "../../src/types/NBridge";
import { Token } from "../../src/types/Token";
import { attach } from "../helper";

let nbridge_kovan = "0x14dcF56cbf4C437449FE3811228D2E853B23E55f"
let nbridge_bsc = "0x7B8C0668F4B5f3d8D4695864041F1f0C31e2F86C"
let nbridge_matic = "0x944d7466B3c246BBeFAB03a51FBfF6Ac6355570E"
let boring_kovan = "0x55FB3193F6e42D6753691c8aA38800B2753FB7d0"
let boring_bsc = "0xC2769060Ea91EC67bca1e6Bedb02e3017a7C0d32"
let boring_matic = "0x6F4E99b40FdF51bADc6C31361e17D5E1Bb33A13e"


async function main() {
	let accounts = await ethers.getSigners()
	let deployer = await accounts[0].getAddress()
	// await crossOut(boring_kovan, nbridge_kovan, 97, parseEther("3000"), deployer)
	// await crossOut(boring_kovan, nbridge_kovan, 80001, parseEther("5000"), deployer)
	await crossOut(boring_bsc, nbridge_bsc, 42, parseEther("1000"), deployer)
	// await crossOut(boring_bsc, nbridge_bsc, 80001, parseEther("500"), deployer)
	// await crossOut(boring_matic, nbridge_matic, 42, parseEther("2000"), deployer)
	// await crossOut(boring_matic, nbridge_matic, 97, parseEther("800"), deployer)
}

async function crossOut(tokenAddr: string, bridgeAddr: string, toChainId: number, amount: BigNumberish, to: string) {
	let boring = await attach("Token", tokenAddr) as Token
	let bridge = await attach("NBridge", bridgeAddr) as NBridge

	let tx  = await boring.approve(bridge.address, ethers.constants.MaxUint256)
	await tx.wait()

	let txCrossOut = await bridge.crossOut(tokenAddr, toChainId, to, amount)
	console.log(`txCrossOut ${txCrossOut.hash}`)
	await txCrossOut.wait()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });