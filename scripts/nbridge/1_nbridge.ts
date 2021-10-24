import { ethers, network, getChainId } from "hardhat";
import { attach, deploy, getChainIdByName } from "../helper";
import { NBridge } from "../../src/types/NBridge";
import { parseEther } from "ethers/lib/utils";
import { TestIToken } from "../../src/types/TestIToken";

async function main() {
	console.log(`network ${network.name} ${Number(await getChainId())}`)
	let accounts = await ethers.getSigners()
	let nb = await getNBridge()
	let chainid = Number(await getChainId())
	console.log(`${chainid}`)
	let ti;
	let tokenChainId;
	let kovanBoring = "0x0f2CF52E02430420CfEedc6aF2A95e95658876fB"
	let bscBoring = "0xf12645652B6b6183DaeB38d4c2bb3e1491eBA038"
	let maticBoring = "0x32727C5D4D8320D49e34ECF7eC9b0C0921283C46"
	let crosserKey = await nb.getRoleKey(kovanBoring, 1)
	let crosser = "0xC63573cB77ec56e0A1cb40199bb85838D71e4dce"
	switch (network.name) {
		case 'kovan':
			ti = { tokenType: 1, mirrorAddress: kovanBoring, mirrorChainId: chainid, isSupported: true }
			await nb.addSupportToken(chainid, kovanBoring, ti)
			await nb.setThreshold(kovanBoring, 1)
			await nb.setFee(kovanBoring, parseEther("0.005"))
			await nb.setFeeTo(await accounts[0].getAddress())
			await nb.grantRole(crosserKey, crosser)
			// await grantMinterBurner(nb, kovanBoring)
			break;
		case 'bsc_test':
			tokenChainId = getChainIdByName("kovan");
			ti = { tokenType: 2, mirrorAddress: bscBoring, mirrorChainId: chainid, isSupported: true }
			await nb.addSupportToken(tokenChainId, kovanBoring, ti)
			await nb.setThreshold(kovanBoring, 1)
			await nb.setFee(kovanBoring, parseEther("0.005"))
			await nb.setFeeTo(await accounts[0].getAddress())
			await nb.setMinCrossAmount(kovanBoring, 1, parseEther("1000"))
			await nb.grantRole(crosserKey, crosser)
			await grantMinterBurner(nb, bscBoring)
			break
		case 'matic_test':
			tokenChainId = getChainIdByName("kovan");
			ti = { tokenType: 2, mirrorAddress: maticBoring, mirrorChainId: chainid, isSupported: true }
			await nb.addSupportToken(tokenChainId, kovanBoring, ti)
			await nb.setThreshold(kovanBoring, 1)
			await nb.setFee(kovanBoring, parseEther("0.005"))
			await nb.setFeeTo(await accounts[0].getAddress())
			await nb.setMinCrossAmount(kovanBoring, 1, parseEther("1000"))
			await nb.grantRole(crosserKey, crosser)
			await grantMinterBurner(nb, maticBoring)
			break
		default:
			console.error('Not known network');
			process.exit(-1)
	}
}

async function getNBridge(): Promise<NBridge> {
	return await deployNBridge(Number(await getChainId()))
}

async function deployNBridge(chainID: number): Promise<NBridge> {
	let nb = await deploy("NBridge", chainID) as NBridge
	return nb;
}

async function grantMinterBurner(nb: NBridge, tokenAddr: string) {
	let token = await attach("TestIToken", tokenAddr)
	console.log(`grant role to bridge ${nb.address}`)
	const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
	const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
	await (await token.grantRole(minter, nb.address)).wait()
	await (await token.grantRole(burner, nb.address)).wait()
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});