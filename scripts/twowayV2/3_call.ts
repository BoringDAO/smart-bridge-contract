import { Contract } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers, getChainId, network } from "hardhat";
import { ERC20 } from "../../src/types/ERC20";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayChef } from "../../src/types/TwoWayChef";
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	// let networkToChange = ['matic_test', 'kovan', 'bsc_test']
	let networkToChange = ['heco']
	let center_chain = "matic"
	let tokenSymbol = "USDT"
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let cChainId = network.config.chainId!
		let cChainIdStr = network.config.chainId!.toString()
		console.log(network.name, cChainId)
		// todo
		if (n == center_chain) {


			let tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
			// let chainidCenter = await tw.chainId()
			// console.log(`chainid center ${ethers.utils.formatUnits(chainidCenter, 0)} tw ${tw.address}`)
			// let centerToken = await tw.toCenterToken(42, "0x35D50cbc648c533A5DA29f4899955bd116fC738C")
			// console.log(`center token ${centerToken}`)
			// let roleKey = await tw.getRoleKey(centerToken)
			// console.log(`roleKey ${roleKey}`)
			// let hasRole = await tw.hasRole(roleKey, "0x79a1215469fab6f9c63c1816b45183ad3624be34")
			// console.log(`has role ${hasRole}`)
			// let [sender1, sender2] = await tw.getMsgSender()
			// console.log(`sender ${sender1}`)

			let oUSDTAddr = contracts[cChainIdStr]['oUSDT']
			let oUSDT = await attach("TwoWayCenterToken", oUSDTAddr) as TwoWayCenterToken
			// let minterRoleKey = await oUSDT.MINTER_ROLE()
			// let burnerRoleKey = await oUSDT.BURNER_ROLE()
			// let txSetBurner = await oUSDT.grantRole(burnerRoleKey, tw.address)
			// console.log(`txSetBurner ${txSetBurner.hash}`)
			// await txSetBurner.wait()

			let chefAddr = contracts[cChainIdStr]['TwoWayChef']
			let chef = await attach("TwoWayChef", chefAddr) as TwoWayChef


			// let txSetDispatcher = await chef.setDispather("0xA11aa155D313671b727ad5399Fe10477E0e2D905")
			// await txSetDispatcher.wait()
			// let txApprove = await oUSDT.approve(chef.address, ethers.utils.parseEther("10000000"))
			// await txApprove.wait()
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

			let txCrossIn = await tw.crossIn({fromChainId: 137, fromToken: "0x413cfe1c41f98879365d665cacb7e79a60001fee", from: "0x53e34401091b531654b8aaed4ee03ad3e75a0629", toChainId: 128, toToken: "0xa71edc38d189767582c38a3145b5873052c3e47a", to: "0x53e34401091b531654b8aaed4ee03ad3e75a0629", amount:ethers.utils.parseEther("37.62")}, "0x2f7f1be2a031ee38948567a5ea7c08fff379446d8cc3d09a1d154c9e135b0acb")
			console.log(`txCrossIn ${txCrossIn.hash}`)
			await txCrossIn.wait()
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