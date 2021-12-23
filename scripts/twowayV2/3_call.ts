import { Contract } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, getChainId, network } from "hardhat";
import { ERC20 } from "../../src/types/ERC20";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	// let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	let networkToChange = ['matic_test']
	let center_chain = "matic_test"
	let tokenSymbol = "USDT"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		if (n == center_chain) {


			let tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
			let chainidCenter = await tw.chainId()
			console.log(`chainid center ${ethers.utils.formatUnits(chainidCenter, 0)} tw ${tw.address}`)
			let centerToken = await tw.toCenterToken(42, "0x35D50cbc648c533A5DA29f4899955bd116fC738C")
			console.log(`center token ${centerToken}`)
			let roleKey = await tw.getRoleKey(centerToken)
			console.log(`roleKey ${roleKey}`)
			let hasRole = await tw.hasRole(roleKey, "0x79a1215469fab6f9c63c1816b45183ad3624be34")
			console.log(`has role ${hasRole}`)
			let [sender1, sender2] = await tw.getMsgSender()
			console.log(`sender ${sender1}`)

			let oUSDTAddr = contracts[cChainIdStr]['oUSDT']
			let oUSDT = await attach("TwoWayCenterToken", oUSDTAddr) as TwoWayCenterToken
			let minterRoleKey = await oUSDT.MINTER_ROLE()
			let burnerRoleKey = await oUSDT.BURNER_ROLE()
			let txSetBurner = await oUSDT.grantRole(burnerRoleKey, tw.address)
			console.log(`txSetBurner ${txSetBurner.hash}`)
			await txSetBurner.wait()
			continue

			let oToken = await deployProxy("TwoWayCenterToken", "oUSDT", "oUSDT") as TwoWayCenterToken
			contracts[cChainIdStr]['oUSDT'] = oToken.address
			for (let edgeChain of networkToChange) {
				let tx = await tw.addToken(oToken.address, getChainIdByName(edgeChain), contracts[getChainIdByName(edgeChain)][tokenSymbol])
				console.log(`add token ${tx.hash}`)
				await tx.wait()
			}

		} else {
			let tw = await attach("TwoWayEdge", contracts[cChainIdStr]['TwoWayV2']) as TwoWayEdge

			let chainidCenter = await tw.chainId()
			console.log(`chainid center ${ethers.utils.formatUnits(chainidCenter, 0)} tw ${tw.address}`)
			continue
			let rawTokenAddr = contracts[cChainIdStr][tokenSymbol]
			let rawToken = await attach("ERC20", contracts[cChainIdStr][tokenSymbol]) as ERC20
			let txApprove = await rawToken.approve(tw.address, ethers.constants.MaxInt256)
			await txApprove.wait()
			await deposit(tw, rawTokenAddr)

		}
	}

}

async function deposit(tw: TwoWayCenter | TwoWayEdge, rawTokenAddr: string) {
	let txDeposit = await tw.deposit(rawTokenAddr, parseUnits("100", 6))
	console.log(`deposit hash ${txDeposit.hash}`)
	await txDeposit.wait()
}

async function crossOut() {
	
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});