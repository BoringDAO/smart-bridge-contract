import { Contract } from "ethers";
import { ethers, getChainId, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayChef } from "../../src/types/TwoWayChef";
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
    let contracts = JSON.parse(getContractsAddress())
    let usdtToken: TestERC20
    let networkToChange = ['matic']
    let rewardPerSecond = ethers.utils.parseEther("0.2822")


    for (let n of networkToChange) {
        hre.changeNetwork(n)
        const accounts = await ethers.getSigners();
        console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
        let cChainId = network.config.chainId!
        let cChainIdStr = network.config.chainId!.toString()
        console.log(network.name, cChainId)
        // todo
        let chef = await attach("TwoWayChef", contracts[cChainIdStr]["TwoWayChef"]) as TwoWayChef
        let oldRPS = await chef.rewardPerSecond()
        console.log(`old RPS: ${ethers.utils.formatEther(oldRPS)}`)
        let tx = await chef.updateRewardPerSecond(rewardPerSecond, true)
        console.log(`tx hash: ${tx.hash}`)
        await tx.wait()
        let newRPS = await chef.rewardPerSecond()
        console.log(`new RPS: ${ethers.utils.formatEther(newRPS)}`)
    }

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })