import { Contract } from "ethers";
import { ethers, getChainId, network } from "hardhat";
import { TestERC20 } from "../../src/types/TestERC20";
import { TwoWayCenter } from "../../src/types/TwoWayCenter"
import { TwoWayCenterToken } from "../../src/types/TwoWayCenterToken"
import { TwoWayEdge } from "../../src/types/TwoWayEdge"
import { ALL_CHAIN_NAME, attach, deploy, deployProxy, getChainIdByName, getContractsAddress, writeContractAddress } from "../helper";
const hre = require("hardhat")

async function main() {
    let contracts = JSON.parse(getContractsAddress())
    let usdtToken: TestERC20
    // let networkToChange = ['matic']
    let networkToChange = ['matic']
	// let networkToChange2 = ['mainnet', 'bsc', 'matic', 'okex', 'heco' , 'fantom', 'harmony', 'avax', 
	// 			'xdai', 'op', 'arbi', 'metis', 'aurora']
    // let networkToChange2 = ['metis']
    // let networkToChange2 = ALL_CHAIN_NAME
    let networkToChange2 = ['metis']
    let center_chain = "matic"
    let tokenSymbol = "USDC"
    let oTokenSymbol = "o" + tokenSymbol
    let tokenPriece = 1
    let lowAmount = (100000 / tokenPriece).toFixed(8)
    let highAmount = (500000 / tokenPriece).toFixed(8)
    let fixFeeToETH = (60 / tokenPriece).toFixed(8)
    let fixFeeToL2 = (10 / tokenPriece).toFixed(8)
    let fixFeeToNormal = (2 / tokenPriece).toFixed(8)
    console.log(`lowAmount ${lowAmount} highAmount ${highAmount}`)
    console.log(`fixFeeToETH ${fixFeeToETH} fixFeeToL2 ${fixFeeToL2} fixFeeToNormal ${fixFeeToNormal}`)
    console.log(`gooooo`)
    // let ratioHigh = ethers.utils.parseEther("0.01")
    // let ratioMedium = ethers.utils.parseEther("0.003")
    // let ratioLow = ethers.utils.parseEther("0.0005")

    let ratioHigh = ethers.utils.parseEther("0")
    let ratioMedium = ethers.utils.parseEther("0")
    let ratioLow = ethers.utils.parseEther("0")

    let remainLow = ethers.utils.parseEther(lowAmount)
    let remainHigh = ethers.utils.parseEther(highAmount)


    for (let n of networkToChange) {
        hre.changeNetwork(n)
        const accounts = await ethers.getSigners();
        console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`)
        let cChainId = network.config.chainId!
        let cChainIdStr = network.config.chainId!.toString()
        console.log(network.name, cChainId)
        // todo
            let tw = await attach("TwoWayCenter", contracts[cChainIdStr]['TwoWayV2']) as TwoWayCenter
            // setOToken
            let oToken = await attach("ERC20", contracts[cChainIdStr][oTokenSymbol]) as TwoWayCenterToken

            let toChainIds = []
            let fixFees = []
            let ratioFeesHigh = []
            let ratioFeesMedium = []
            let ratioFeesLow = []
            let remains = [remainHigh, remainLow]
            for (let edgeChain of networkToChange2) {
                // if (n == edgeChain) {
                // 	continue
                // }
                console.log(`edge chain ${edgeChain}`)
                console.log(`${oToken.address}`)
                console.log(`${contracts[getChainIdByName(edgeChain)][tokenSymbol]}`)
                toChainIds.push(getChainIdByName(edgeChain))
                if (edgeChain == "mainnet" || edgeChain == "kovan") {
                    fixFees.push(ethers.utils.parseEther(fixFeeToETH))
                } else if (edgeChain == "boba" || edgeChain == "op" || edgeChain == "arbi") {
                    fixFees.push(ethers.utils.parseEther(fixFeeToL2))
                } else {
                    fixFees.push(ethers.utils.parseEther(fixFeeToNormal))
                }
                ratioFeesHigh.push(ratioHigh)
                ratioFeesMedium.push(ratioMedium)
                ratioFeesLow.push(ratioLow)
            }
            let txSetFee = await tw.setFee(oToken.address, toChainIds, fixFees, ratioFeesHigh, ratioFeesMedium, ratioFeesLow, remains)
            console.log(`tx set fee ${txSetFee.hash}`)
            await txSetFee.wait()
    }

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })