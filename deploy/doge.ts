import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployments, network, getNamedAccounts} from 'hardhat'

const {deploy} = deployments;	

const func: DeployFunction = async function () {
	//deploy token
	switch (network.name) {
		case 'bsc_test':
			break
		case 'okex_test':
			break
		default:
			console.error("Not known network")
			process.exit(1)
	}
	
}

export default func;
func.tags = ['doge']