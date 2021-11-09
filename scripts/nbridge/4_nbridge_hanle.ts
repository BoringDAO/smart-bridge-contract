import { network } from "hardhat";
import { NBridge } from "../../src/types/NBridge";
import { attach, getContractsAddress } from "../helper";
const hre = require('hardhat')
async function main() {
	let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai"]
	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let contracts_data = getContractsAddress()
		let contracts = JSON.parse(contracts_data)
		let chainId = network.config.chainId!
		let nbridgeAddress = contracts[chainId.toString()]['nbridge']
		let nb = await attach("NBridge", nbridgeAddress) as NBridge
		// nb.calculateFee()
		let thre = await nb.threshold("0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA")
		console.log(thre.toString(), network.config.chainId)
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});