import { BigNumber, BigNumberish, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { BigNumber as RawBigNumber } from "bignumber.js"

import { ethers, network, upgrades } from "hardhat";
import { ERC20 } from "../src/types/ERC20";
import { BoringToken } from "../src/types/BoringToken";
import { TwoWay } from "../src/types/TwoWay";
import { SwapPair } from "../src/types/SwapPair";
import { readFile, readFileSync, writeFileSync } from "fs";

export async function deploy(name: string, ...params: any[]) {
	const contractFactory = await ethers.getContractFactory(name);
	const con = await contractFactory.deploy(...params)
	await con.deployed()
	console.log(`deployed ${name} at ${network.name}: ${con.address}`)
	return con
}

export async function attach(name: string, addr: string) {
	return await ethers.getContractAt(name, addr)
}

export async function setTwoWay(usdt: ERC20,
	tw: TwoWay,
	swapPair: SwapPair,
	chainIDs: number[],
	token0: string,
	token1s: string[],
	crosser: string,
	fixFee: string,
	ratioFee: string,
	removeFee: string
) {
	if (chainIDs.length != token1s.length) {
		console.error("chainIDs and token1s length not match")
		process.exit(1)
	}
	let token0s: string[] = [];
	for (let i = 0; i < token1s.length; i++) {
		token0s.push(token0)
	}

	const tx1 = await swapPair.setTwoWay(tw.address)
	console.log(`tx setTwoWay ${tx1.hash}`)
	await tx1.wait()
	// TwoWay
	const tx2 = await tw.addPair(usdt.address, swapPair.address, chainIDs)
	console.log(`tx addPair ${tx2.hash}`)
	await tx2.wait()

	let token0Decimals = await usdt.decimals()
	let fixFees: BigNumberish[] = []
	let ratioFees: BigNumberish[] = []
	for (let i = 0; i < chainIDs.length; i++) {
		fixFees.push(ethers.utils.parseUnits(fixFee, token0Decimals))
		ratioFees.push(ethers.utils.parseEther(ratioFee))
	}
	const tx3 = await tw.setFees(token0s, chainIDs, fixFees, ratioFees)
	console.log(`tx setFees ${tx3.hash}`)
	await tx3.wait()

	const tx4 = await tw.setRemoveFee(usdt.address, ethers.utils.parseUnits(removeFee, token0Decimals))
	console.log(`tx setRemoveFee ${tx4.hash}`)
	await tx4.wait()

	const tx5 = await tw.setThreshold(usdt.address, 1)
	console.log(`tx setThreshold ${tx5.hash}`)
	await tx5.wait()

	const tx6 = await tw.grantRole(ethers.utils.formatBytes32String("CROSSER_ROLE"), crosser)
	console.log(`tx grantRole ${tx6.hash}`)
	await tx6.wait()

	const tx7 = await tw.addSupportTokens(token0s, token1s, chainIDs)
	console.log(`tx addSupportToken ${tx7.hash}`)
	tx7.wait()

}

export async function setFees(usdt: ERC20,
	tw: TwoWay,
	chainIDs: number[],
	token0: string,
	token1s: string[],
	fixFee: string,
	ratioFee: string,
) {
	if (chainIDs.length != token1s.length) {
		console.error("chainIDs and token1s length not match")
		process.exit(1)
	}
	let token0s: string[] = [];
	for (let i = 0; i < token1s.length; i++) {
		token0s.push(token0)
	}

	let token0Decimals = await usdt.decimals()
	let fixFees: BigNumberish[] = []
	let ratioFees: BigNumberish[] = []
	for (let i = 0; i < chainIDs.length; i++) {
		fixFees.push(ethers.utils.parseUnits(fixFee, token0Decimals))
		ratioFees.push(ethers.utils.parseEther(ratioFee))
	}
	const tx3 = await tw.setFees(token0s, chainIDs, fixFees, ratioFees)
	console.log(`tx setFees ${tx3.hash}`)
	await tx3.wait()

}

export function getChainIdByName(chainName: string): number {
    switch (chainName) {
        case 'bsc_test':
            return 97;
        case 'okex_test':
            return 65;
        case 'matic_test':
            return 80001;
        case 'kovan':
            return 42
        case 'avax_test':
            return 43113
        case 'fantom_test':
            return 4002
        case 'xdai_test':
            return 77
        case 'heco_test':
            return 256
        case 'harmony_test':
            return 1666700000
        case 'mainnet':
            return 1
        case 'bsc':
            return 56
        case 'okex':
            return 66
        case 'heco':
            return 128
        case 'matic':
            return 137
        case 'fantom':
            return 250
        case 'xdai':
            return 100
        case 'harmony':
            return 1666600000
        case 'avax':
            return 43114
        case 'arbitrum':
            return 42161
        case 'op':
            return 10
        default:
            console.error('not known network');
            process.exit(-1);
    }
}

export function getContractsAddress(): string {
	let data: string = ""
	// readFileSync('../contracts.json', 'utf-8', (err, data) => {
	// 	if (err) {
	// 		throw err;
	// 	}
	// 	// let contracts = JSON.parse(data.toString())
	// 	data =  data.toString()
	// 	console.log("data", data)
	// })
	let file = readFileSync('contracts.json', 'utf-8')
	data = file.toString()
	return data
}

export function writeContractAddress(data: string) {
	writeFileSync('./contracts.json', data)
}

export async function deployProxy<T>(name: string, ...params: any[]) {
	const contractFactory = await ethers.getContractFactory(name);

	const proxy = await upgrades.deployProxy(contractFactory, [...params], { kind: 'uups' })
	await proxy.deployed()
	console.log(`deploy ${name} proxy at ${proxy.address}`)
	return proxy as unknown as T
}