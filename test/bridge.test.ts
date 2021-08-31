import { formatUnits } from "@ethersproject/units";
import { ethers, upgrades } from "hardhat";
import { Bridge } from "../src/types/Bridge"

describe('Proxy', async () => {
	let bridgeProxy: Bridge;
	before(async () => {
		const Bridge = await ethers.getContractFactory('Bridge')
		bridgeProxy = await upgrades.deployProxy(Bridge, [2], { kind: 'uups' }) as Bridge
	})

	it('chainid', async () => {
		let chainid = await bridgeProxy.chainID()
		console.log(formatUnits(chainid, '0'))
	})
})