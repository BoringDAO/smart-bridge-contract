import { BigNumber, BigNumberish, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import {BigNumber as RawBigNumber} from "bignumber.js"

import { ethers} from "hardhat";

export async function deploy(name: string, ...params: any[]) {
	const contractFactory = await ethers.getContractFactory(name);
	const con = await contractFactory.deploy(...params)
	await con.deployed()
	return con
}

export async function attach(name: string, addr: string) {
	return await ethers.getContractAt(name, addr)
}