import { network, getChainId } from "hardhat";
import { attach, deploy, getChainIdByName} from "../helper";
import { NBridge } from "../../src/types/NBridge";

async function main() {
	console.log(`network ${network.name} ${Number(await getChainId())}`)
	let nb = await getNBridge()
	let chainid = Number(await getChainId())
	console.log(`${chainid}`)
	let ti;
	let tokenChainId;
	let kovanBoring = "0x0f2CF52E02430420CfEedc6aF2A95e95658876fB"
	let bscBoring = "0xf12645652B6b6183DaeB38d4c2bb3e1491eBA038"
	let maticBoring = "0x32727C5D4D8320D49e34ECF7eC9b0C0921283C46"
	switch (network.name) {
        case 'kovan':
			ti = {tokenType: 1, mirrorAddress: kovanBoring, mirrorChainId: chainid, isSupported: true}
			await nb.addSupportToken(chainid, kovanBoring, ti)
            break;
        case 'bsc_test':
			tokenChainId = getChainIdByName("kovan");
			ti = {tokenType: 2, mirrorAddress: bscBoring, mirrorChainId: chainid, isSupported: true}
			await nb.addSupportToken(tokenChainId, kovanBoring, ti)
			break
		case 'matic_test':
			tokenChainId = getChainIdByName("kovan");
			ti = {tokenType: 2, mirrorAddress: maticBoring, mirrorChainId: chainid, isSupported: true}
			await nb.addSupportToken(tokenChainId, kovanBoring, ti)
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });