import { deploy, getContractsAddress, writeContractAddress } from "../helper";
import { TestIToken } from "../../src/types/TestIToken"
import { ethers, getChainId, hardhatArguments, network } from "hardhat";
import { parseEther } from "@ethersproject/units";
import { Token } from "../../src/types/Token";
const hre = require("hardhat")
import contractInfo from "../../contracts.json";
import { readFile } from "node:fs";
import { getChainIdByName } from "../helper"


async function main1() {
	// kovan BSC matic
	let info = getContractsAddress()
	let infoJSON = JSON.parse(info)
	let networkToChange = ["mainnet"]
	let contractName = "BoringDAOV2"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}
	for (let n of networkToChange) {
		hre.changeNetwork(n)
	    let accounts = await ethers.getSigners()
	    let deployer = await accounts[0].getAddress()
        console.log(`deployer ${deployer}`)
		let token
		let chainId = network.config.chainId?.toString()!
		console.log(network.name, network.config.chainId)
		let contractAddress = infoJSON[chainId][contractName]
		console.log(infoJSON[chainId])
        const abi = [
            "function setMintCap(uint256 amount) public",
            "function mintCap() public view returns(uint256)"
        ]
        let bdV2 = new ethers.Contract(contractAddress, abi, ethers.provider)
        let capAmount = await bdV2.mintCap()
        console.log(`capAmount ${ethers.utils.formatEther(capAmount)}`)
        
        bdV2 = bdV2.connect(accounts[0])
        let txSetMintCap = await bdV2.setMintCap(ethers.utils.parseEther("1"))
        console.log(`tx SetMintCap ${txSetMintCap.hash}`)
        await txSetMintCap.wait(1)
	}
}

main1()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});