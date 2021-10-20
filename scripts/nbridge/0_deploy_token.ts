import { deploy } from "../helper";
import {TestIToken} from "../../src/types/TestIToken"
import { network } from "hardhat";
import { parseEther } from "@ethersproject/units";


async function main1() {
	// kovan BSC matic
	if (network.name === "kovan") {
		let token = await deploy("TestIToken", "BoringDAO Token", "BORING", parseEther("100000000")) as TestIToken
	} else {
		let token = await deploy("TestIToken", "BoringDAO Token", "BORING", 0) as TestIToken
	}
}

main1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });