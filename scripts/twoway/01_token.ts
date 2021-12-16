import { run, ethers, network } from "hardhat";
import { attach, deploy, getContractsAddress, writeContractAddress } from "../helper";
import { TestERC20 } from '../../src/types/TestERC20'
import { TestIToken } from "../../src/types/TestIToken";

async function main() {
	await run("compile");
	const accounts = await ethers.getSigners();

	let contracts = JSON.parse(getContractsAddress())
	let cChainId = network.config.chainId!.toString()
	console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
	let usdtToken: TestERC20
	let twowayLP: TestIToken
	switch (network.name) {
		case 'okex_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
			break
		case 'bsc_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
			twowayLP = await deploy("TestIToken", "TLP", "TLP", 18) as TestIToken
			break
		case 'kovan':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			twowayLP = await deploy("TestIToken", "TLP", "TLP", 18) as TestIToken
			break
		case 'avax_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'fantom_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'xdai_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'heco_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 18) as TestERC20
			break
		case 'harmony_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'arbi_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		case 'op_test':
			usdtToken = await deploy("TestERC20", "USDT", "USDT", 6) as TestERC20
			break
		default:
			console.error(`Not known network ${network.name}`)
	}
	contracts[cChainId]['USDT'] = usdtToken!.address
	contracts[cChainId]['TwoWayLP'] = twowayLP!.address
	console.log(contracts)
	writeContractAddress(JSON.stringify(contracts))
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});