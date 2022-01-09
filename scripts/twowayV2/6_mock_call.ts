import { parseEther } from "ethers/lib/utils"
import { utimes } from "fs"
import { ethers, getChainId, network, upgrades } from "hardhat"
import { ERC20 } from "../../src/types/ERC20"
import { NBridge } from "../../src/types/NBridge"
import { StakingReward } from "../../src/types/StakingReward"
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayChef } from "../../src/types/TwoWayChef"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deployProxy, getChainIdByName, getContractsAddress } from "../helper"

const hre = require("hardhat")

async function main() {
	let accounts = await ethers.getSigners()
	// let mock_user = "0x2353178C6c05378812f024A783541857634A1e82"
	// let mock_user = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
	// let mock_user = "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
	// let mock_user = "0xB45C219eFf9A489Ef4287DC19fE6e942637445dE"
	let mock_user = "0x53E34401091B531654b8AAEd4EE03AD3e75A0629"
	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [mock_user],
	});
	const signer = await ethers.getSigner(mock_user)

	console.log(`network ${network.name} deployer ${await accounts[0].getAddress()} ${Number(await getChainId())}`)
	// let networkToChange = ["xdai"]	
	// let networkToChange = ["mainnet", "bsc", "okex", "harmony", "avax", "matic", "heco", "fantom", "xdai", 'op', 'arbi', 'boba']
	let networkToChange = ["hardhat"]
	// let networkToChange = ['heco']
	let contracts = JSON.parse(getContractsAddress())
	let allChain = ["mainnet", "metis"]
	let tokenSymbol = "USDT"

	for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}	

	for (const n of networkToChange) {
		hre.changeNetwork(n)
		let chainid = network.config.chainId!
		let chainIdStr = network.config.chainId!.toString()
		console.log(`network name ${network.name} ${network.config.chainId!}`)
		// let tw: TwoWayCenter|TwoWayEdge
		let tw: TwoWayCenter
		if (contracts[chainid.toString()]['TwoWayV2'] != undefined) {
			// if (network.config.chainId == 100) {
			// 	nb = await attach("NBridge", contracts[chainid.toString()]['nbridge']) as NBridge
			// } else {
			// 	continue
			// }
			// continue
			let twAddr = contracts[chainid.toString()]['TwoWayV2'];
			console.log(`twAddr ${twAddr}`)
			tw = await attach("TwoWayCenter", twAddr) as TwoWayCenter
			// nb.calculateFee
		} else {
			console.log("network error: nbridge not exist")
			process.exit(-1)
		}
		let tokenAddr  = contracts[chainIdStr][tokenSymbol]
		let tw2 = tw.connect(signer)
		let token = await ethers.getContractAt("ERC20", tokenAddr) as ERC20
		token = token.connect(signer)
		// let tx = await nb2.crossOut(tokenAddr, 1, await signer.getAddress(), parseEther("0.6"))
		// tx.wait()
		// let tx = await token.approve(tw2.address, ethers.constants.MaxUint256)
		// await tx.wait()

		// let [sender1, sender2] = await tw.getMsgSender()
		// console.log(`sender ${sender1}`)
		
		// let txCrossOut = await tw2.crossOut(tokenAddr, 97, mock_user, ethers.utils.parseUnits("100", 6))
		// console.log(`txCrossOut ${txCrossOut.hash}`)
		// await txCrossOut.wait()

		// let param = {
		// 	fromChainId: 42,
		// 	fromToken: "0x35D50cbc648c533A5DA29f4899955bd116fC738C",
		// 	from: "0x2353178C6c05378812f024A783541857634A1e82",
		// 	toChainId: 80001,
		// 	toToken: "0x0000000000000000000000000000000000000000",
		// 	to: "0x2353178C6c05378812f024A783541857634A1e82",
		// 	amount: ethers.utils.parseEther("1000")
		// }
		// let tx = await tw2.issue(param, "0xab522d97170ccdad815272d3492b50dd628754a7ba7b5df413b1a2256d81e185")
		// // let tx = await tw2.issue(42, "0x35D50cbc648c533A5DA29f4899955bd116fC738C", "0x2353178C6c05378812f024A783541857634A1e82", "0x2353178C6c05378812f024A783541857634A1e82", ethers.utils.parseEther("1000"), "0x04f45e56b7670492012ee8ca2daccfe5879d26286e237b953d74bdd4dd083abb")
		// await tx.wait()

		// let srAddr = contracts[chainIdStr]['StakingRewardForChef']
		// let sr = await ethers.getContractAt("StakingReward", srAddr) as StakingReward
		// let srRate = await sr.rewardRate()
		// console.log(`srRate ${ethers.utils.formatEther(srRate)}`)
		// let earned =  await sr.earned("0x2353178C6c05378812f024A783541857634A1e82")
		// console.log(`earned ${ethers.utils.formatEther(earned)}`)

		let chefAddr = contracts[chainIdStr]["TwoWayChef"]
		let chef = await ethers.getContractAt("TwoWayChef", chefAddr) as TwoWayChef
		chef = chef.connect(signer)
		
		// let oUSDTAddr = contracts[chainIdStr]['oUSDT']
		// let lock = await tw2.lockBalances(oUSDTAddr, 137)
		// console.log(`lock Amount ${ethers.utils.formatEther(lock)}`)

		let [depositAmount] = await chef.userInfo(0, "0xB45C219eFf9A489Ef4287DC19fE6e942637445dE")
		console.log(`depositAmount ${ethers.utils.formatEther(depositAmount)}`)
		let dispatcher = await chef.dispatcher()
		console.log(`dispatcher ${dispatcher}`)

		// let txWithdraw = await chef.withdraw(0, ethers.utils.parseEther("2"))
		// await txWithdraw.wait()

		// let txDeposit = await chef.deposit(0, ethers.utils.parseEther("1"))
		// await txDeposit.wait()

	}

}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});