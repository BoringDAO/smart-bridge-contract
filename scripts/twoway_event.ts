import { formatUnits } from "@ethersproject/units"
import { ethers } from "hardhat"
import { TwoWay } from "../src/types/TwoWay"

async function main() {

	let twoway = await ethers.getContractAt('TwoWay', '0xc2034ff0b9317455e50991073c0e2e37d5a28ce7') as TwoWay
	let fil = twoway.filters.Lock(null, null, null, null, null, null, null)
	let [{args}] = await twoway.queryFilter(fil, 14091440, 14091440)
	let {chainID0, chainID1} = args
	console.log(`chainid0 ${formatUnits(chainID0, '0')}`)
	console.log(`chainid1 ${formatUnits(chainID1, '0')}`)
	
}

main().then( () => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})