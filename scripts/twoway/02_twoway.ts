import { run, ethers, network } from 'hardhat';
import { attach, deploy, deployProxy, getChainIdByName, getContractsAddress, setFees, setTwoWay } from '../helper';
import { TestERC20 } from '../../src/types/TestERC20';
import { TwoWay } from '../../src/types/TwoWay';
import { SwapPair } from '../../src/types/SwapPair';
import { ERC20 } from '../../src/types/ERC20';
import { parseEther } from '@ethersproject/units';
import { config } from 'node:process';
const hre = require("hardhat")

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = await accounts[0].getAddress();

    console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`);

    // await crossOut(network.name, '30000', 'matic_test', deployer)
    // process.exit(0)
    // await setUnlockFeeOn()
    // return

    // let crosser = '0xc38068d89b16a1dae117974f30230f4afd654b3c';
    // let crosser = '0x2353178C6c05378812f024A783541857634A1e82';
    let crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
    let feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
    let targetChains: string[] = [];
    console.log(network.name, 'target chain', targetChains);
    // let chains = ['bsc', 'matic', 'mainnet', 'okex', 'avax', 'fantom', 'xdai', 'heco', 'harmony', 'arbi', 'op']
    // let networkToChange = ['op']
    // let networkToChange = ['boba', 'op']
    let networkToChange = ['fantom', 'xdai', 'heco', 'harmony', 'arbi', 'op', 'boba']
    for (let n of networkToChange) {
		hre.changeNetwork(n)
		let number = await ethers.provider.getBlockNumber()
		console.log(`check ${n} blockNumber is ${number}`)
	}
	let contracts = JSON.parse(getContractsAddress())
    for (let n of networkToChange) {
		hre.changeNetwork(n)
        console.log(network.name)
        // await addChainIDs(network.name, ['boba'])
        let cchainid = network.config.chainId!.toString()
        let twowayAddr = contracts[cchainid]['TwoWay']
        let usdtAddr = contracts[cchainid]['USDT']
        console.log(`twoway ${twowayAddr}, usdtAddr ${usdtAddr}`)
        let tw = await ethers.getContractAt('TwoWay', twowayAddr) as TwoWay
        // await setRemoveFeeAmount(tw, usdtAddr)

        // let tw = await ethers.getContractAt('TwoWay', twowayAddr) as TwoWay

        let chains = ['bsc', 'matic', 'mainnet', 'okex', 'avax', 'fantom', 'xdai', 'heco', 'harmony', 'arbi', 'op', 'boba']
        await checkFee(tw, network.name, chains)
    }
    return
    // switch (network.name) {
    //     case 'okex_test':
    //         targetChains = ['matic_test', 'bsc_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break;
    //     case 'bsc_test':
    //         targetChains = ['matic_test', 'okex_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break;
    //     case 'matic_test':
    //         targetChains = ['bsc_test', 'okex_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break;
    //     case 'kovan':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'avax_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'fantom_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'xdai_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'xdai_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'fantom_test', 'heco_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'heco_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'harmony_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'harmony_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'arbi_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test', 'op_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'op_test':
    //         targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan', 'avax_test', 'fantom_test', 'xdai_test', 'heco_test', 'harmony_test', 'arbi_test']
    //         await addPair(network.name, targetChains, deployer, crosser)
    //         break
    //     case 'okex':
    //         targetChains = ['matic', 'bsc', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('okex', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break;
    //     case 'bsc':
    //         targetChains = ['matic', 'okex', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('bsc', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break;
    //     case 'matic':
    //         targetChains = ['bsc', 'okex', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('matic', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break;
    //     case 'mainnet':
    //         targetChains = ['bsc', 'okex', 'matic', 'avax', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('mainnet', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "100", "0.005")
    //         break
    //     case 'avax':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('avax', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break
    //     case 'fantom':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('fantom', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break
    //     case 'xdai':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('xdai', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break
    //     case 'heco':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'xdai', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('heco', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break
    //     case 'harmony':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'xdai', 'heco']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('harmony', ['boba'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break
    //     case 'arbi':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony', 'op']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs(network.name, ['boba'])
    //         break
    //     case 'op':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony', 'arbi']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs(network.name, ['boba'])
    //         break
    //     case 'boba':
    //         targetChains = ['bsc', 'okex', 'matic', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony', 'arbi', 'op']
    //         await addPair(network.name, targetChains, feeToDev, crosser)
    //         break
    //     case 'hardhat':
    //         targetChains = ['matic', 'okex', 'mainnet', 'avax', 'fantom', 'xdai', 'heco', 'harmony']
    //         // await addPair(network.name, targetChains, feeToDev, crosser)
    //         await addChainIDs('bsc', ['arbi', 'op'])
    //         // await setCrossFees(network.name, targetChains, "1", "0.005")
    //         break;
    //     default:
    //         console.error('Not known network');
    // }
}

async function addPair(sourceChain: string, targetChains: string[], feeToDev: string, crosser: string) {
    let sourceChainID = getChainId(sourceChain)
    console.log(`source chain ${sourceChain} chainid is ${sourceChainID}, target chain ${targetChains}`)
    let targetChainIDs: number[] = []
    let targetUSDTAddrs: string[] = []
    for (let chainName of targetChains) {
        let chainID = getChainId(chainName);
        targetChainIDs.push(chainID)

        let targetUSDTAddr = getUsdt(chainName);
        targetUSDTAddrs.push(targetUSDTAddr)
    }
    let sourceUSDTAddr = getUsdt(sourceChain)
    let twoWay: TwoWay
    let twoWayAddr = getTwoWayAddr(sourceChain)
    if (twoWayAddr === '') {
        twoWay = await deployProxy("TwoWay", feeToDev, sourceChainID) as TwoWay
    } else {
        twoWay = (await ethers.getContractAt('TwoWay', twoWayAddr)) as TwoWay
    }
    let usdt = (await ethers.getContractAt('TestERC20', sourceUSDTAddr)) as ERC20;
    let swapPair = (await deployProxy('SwapPair', 'TwoWay LP', 'TLP', usdt.address)) as SwapPair;
    // let boringUSDT = (await ethers.getContractAt('BoringToken', '0xcf83FE4d666Adc4605c381A02D54f7990F9adBee')) as BoringToken
    // let swapPair = (await ethers.getContractAt('SwapPair', '0x216f332D17145871D1d5ff5fEB4b08513Ef7Cc21')) as SwapPair
    await setTwoWay(usdt, twoWay, swapPair, targetChainIDs, usdt.address, targetUSDTAddrs, crosser, '0.5', '0.005', '1');
}

async function setCrossFees(sourceChain: string, targetChains: string[], fixFee: string, ratioFee: string) {
    let targetChainIDs: number[] = []
    let targetUSDTAddrs: string[] = []
    for (let chainName of targetChains) {
        let chainID = getChainId(chainName);
        targetChainIDs.push(chainID)

        let targetUSDTAddr = getUsdt(chainName);
        targetUSDTAddrs.push(targetUSDTAddr)
    }
    let sourceUSDTAddr = getUsdt(sourceChain)
    let usdt = (await ethers.getContractAt('TestERC20', sourceUSDTAddr)) as ERC20;
    let twoWay: TwoWay
    let twoWayAddr = getTwoWayAddr(sourceChain)
    if (twoWayAddr === '') {
        console.error("twoway not exist")
        process.exit(-1)
    } else {
        twoWay = (await ethers.getContractAt('TwoWay', twoWayAddr)) as TwoWay
    }
    await setFees(usdt, twoWay, targetChainIDs, usdt.address, targetUSDTAddrs, fixFee, ratioFee)
}

function getChainId(chainName: string): number {
    switch (chainName) {
        case 'bsc_test':
            return 97;
        case 'okex_test':
            return 65;
        case 'matic_test':
            return 80001;
        case 'kovan':
            return 42
        case 'avax_test':
            return 43113
        case 'fantom_test':
            return 4002
        case 'xdai_test':
            return 77
        case 'heco_test':
            return 256
        case 'harmony_test':
            return 1666700000
        case 'arbi_test':
            return 421611
        case 'op_test':
            return 69
        case 'mainnet':
            return 1
        case 'bsc':
            return 56
        case 'okex':
            return 66
        case 'heco':
            return 128
        case 'matic':
            return 137
        case 'fantom':
            return 250
        case 'xdai':
            return 100
        case 'harmony':
            return 1666600000
        case 'avax':
            return 43114
        case 'arbi':
            return 42161
        case 'op':
            return 10
        case 'boba':
            return 288
        default:
            console.error('not known network');
            process.exit(-1);
    }
}

function getUsdt(chainName: string): string {
    switch (chainName) {
        case 'bsc_test':
            return '0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015';
        case 'okex_test':
            return '0xbE64543d9dC5b530ee9bD6259D02d14613Aec9aB';
        case 'matic_test':
            return '0xCB7Bb6e911e79713A596731dc21D0a2EF24a4F74';
        case 'kovan':
            return '0x1D83BcDA708047898F20Cebb4AABF08008783f41';
        case 'avax_test':
            return '0xb608b55b0F777e70F8e37a18F8Da6EC8AE667B33';
        case 'fantom_test':
            return '0xbf49c0ffDEEC5bF1731674841B60E4B0855FE6ED'
        case 'xdai_test':
            return '0xbf49c0ffDEEC5bF1731674841B60E4B0855FE6ED'
        case 'heco_test':
            return '0xAe8234563e2B07E5cB89c6B0d81Fe54CF7667769'
        case 'arbi_test':
            return "0xbf49c0ffDEEC5bF1731674841B60E4B0855FE6ED"
        case 'op_test':
            return "0xbf49c0ffDEEC5bF1731674841B60E4B0855FE6ED"
        case 'harmony_test':
            return '0xbf49c0ffDEEC5bF1731674841B60E4B0855FE6ED'
        case 'mainnet':
            return '0xdac17f958d2ee523a2206206994597c13d831ec7'
        case 'bsc':
            return '0x55d398326f99059ff775485246999027b3197955'
        case 'okex':
            return '0x382bB369d343125BfB2117af9c149795C6C65C50'
        case 'heco':
            return '0xa71edc38d189767582c38a3145b5873052c3e47a'
        case 'matic':
            return '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
        case 'fantom':
            return '0x049d68029688eabf473097a2fc38ef61633a3c7a'
        case 'harmony':
            return '0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f'
        case 'avax':
            return '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        case 'xdai':
            return '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'
        case 'arbi':
            return '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'
        case 'op':
            return '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58'
        case 'boba':
            return "0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d"
        case 'metis':
            return "0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC"
        default:
            console.error('not known network');
            process.exit(-1);
    }
}

function getTwoWayAddr(chainName: string): string {
    switch (chainName) {
        case 'bsc_test':
            return '';
        case 'okex_test':
            return '';
        case 'matic_test':
            return '';
        case 'kovan':
            return '';
        case 'avax_test':
            return '';
        case 'fantom_test':
            return ''
        case 'xdai_test':
            return ''
        case 'heco_test':
            return ''
        case 'harmony_test':
            return ''
        case 'arbi_test':
            return ''
        case 'op_test':
            return ''
        case 'mainnet':
            return '0xF8393Bc60CF8CfcD442BcD742a4Aa847f4B6B4ac';
        case 'bsc':
            return '0xf52D6823D9e2aff7548D9Fe82eeadCA6b1ED3062';
        case 'okex':
            return '0x39b107D2d810954507e7Cd70403fDa4Ae12a192e'
        case 'heco':
            return '0x8b645375a7a3BCeaa01A6eCFd6e58D90b125b454'
        case 'matic':
            return '0x54e2657015a9b5cC65dde59E515c71171312D319';
        case 'xdai':
            return '0x8b645375a7a3BCeaa01A6eCFd6e58D90b125b454'
        case 'fantom':
            return '0xbE4A5438ad89311d8c67882175D0fFcC65Dc9C03'
        case 'avax':
            return '0x0F4C9320B9DE4fa426d3E27D85C3452F52314C57';
        case 'harmony':
            return '0xE3B59FD01c0155A98146a6E0Beb8376B751363fc'
        case 'arbi':
            return '0x11E4BED429b239a1A0C594ADEB71b99e8Fa1011A'
        case 'op':
            return '0xD01a5051253007ae0b7123b50410E3B5A3f6cF95'
        case 'boba':
            return '0xa1C094Be9E6E3d5FA1815aF8c2c80fF19a4FEcdb'
        default:
            console.error('not known network for twoway Addr');
            return ''
    }
}

async function crossOut(chainName: string, amount: string, targetChain: string, to: string) {
    let twoWayAddr = getTwoWayAddr(chainName)
    let usdtAddr = getUsdt(chainName)
    let targetChainId = getChainId(targetChain)
    let tw = await ethers.getContractAt('TwoWay', twoWayAddr) as TwoWay
    let tx = await tw.crossOut(usdtAddr, targetChainId, to, parseEther(amount))
    console.log(`crossOut tx hash ${tx.hash}`)
    await tx.wait()
}

async function setUnlockFeeOn() {
    let tw = await ethers.getContractAt("TwoWay", "0xa1C094Be9E6E3d5FA1815aF8c2c80fF19a4FEcdb") as TwoWay
    let token0Addr = getUsdt("boba")
    let networkToChange = ['avax', 'fantom', 'xdai', 'heco', 'harmony', 'arbi', 'op', 'boba']
    for (const chainName of networkToChange) {
        let chainid = getChainIdByName(chainName)
        let tx = await tw.setUnlockFeeOn(token0Addr, chainid, false)
        await tx.wait(2)
        let isOn = await tw.unlockFeeOn(token0Addr, chainid);
        console.log(`chainid ${chainid} isOn ${isOn}`)
    }
}

async function addChainIDs(chainName: string, targetChain: string[]) {
    let twoWayAddr = getTwoWayAddr(chainName)
    let twoWay = await ethers.getContractAt("TwoWay", twoWayAddr) as TwoWay
    let usdtAddr = getUsdt(chainName)
    // let arbi_usdt = await twoWay.supportToken(usdtAddr, 42161)
    let token0s = []
    let targetChainIds: number[] = []
    let targetUsdtAddrs: string[] = []
    // if (arbi_usdt == "0x0000000000000000000000000000000000000000") {
    //     console.log("not exist")
    //     console.log(arbi_usdt)
    //     for (const name of targetChain) {
    //         targetChainIds.push(getChainId(name))
    //         targetUsdtAddrs.push(getUsdt(name))
    //         token0s.push(usdtAddr)
    //     }
    // } else {
    //     console.log("exist")
    //     console.log(arbi_usdt)
    //     for (const name of targetChain) {
    //         if (name === "arbi") {
    //             continue
    //         }
    //         targetChainIds.push(getChainId(name))
    //         targetUsdtAddrs.push(getUsdt(name))
    //         token0s.push(usdtAddr)
    //     }
    //     // let tx = await twoWay.removeChainIDs(usdtAddr, [42161])
    //     // let tx = await twoWay.removeSupportToken(usdtAddr, 42161)
    //     // tx.wait(3)
    // }
    for (const name of targetChain) {
        targetChainIds.push(getChainId(name))
        targetUsdtAddrs.push(getUsdt(name))
        token0s.push(usdtAddr)
    }
    console.log(` usdt ${token0s}, targetChainIds ${targetChainIds} targetUsdtAddrs ${targetUsdtAddrs}`)
    // process.exit(1)
    let tw = await ethers.getContractAt('TwoWay', twoWayAddr) as TwoWay

    let tx = await tw.addChainIDs(usdtAddr, targetChainIds)
    console.log(`add chainIDs tx hash ${tx.hash}`)
    await tx.wait()

    let tx1 = await tw.addSupportTokens(token0s, targetUsdtAddrs, targetChainIds)
    console.log(`addSupportTokens ${tx1.hash}`)
    await tx1.wait()
}

async function crossUSDT() {
}

async function setRemoveFeeAmount(tw: TwoWay, usdt: string) {
    let removeFee = await tw.removeFeeAmount(usdt)
    console.log(ethers.utils.formatUnits(removeFee, 6))
    let tx = await tw.setRemoveFee(usdt, 0)
    console.log(tx.hash)
    await tx.wait()
}

async function checkFee(tw: TwoWay, cChainName: string, chainIds: string[]) {
    let usdt = getUsdt(cChainName)
    let usdtToken = await ethers.getContractAt('ERC20', usdt) as ERC20
    let token0s = []
    let chainNumbers = []
    let fixAmounts = []
    let ratioAmounts = []
    for (const chainIdString of chainIds) {
        if (cChainName == chainIdString) {
            continue
        }
        if (!(chainIdString == 'boba' || chainIdString == 'op' || chainIdString == 'arbi')) {
            continue
        }
        let chainId = getChainId(chainIdString)
        let fixFee = await tw.feeAmountM(usdt, chainId)
        console.log(`${cChainName} from ${chainIdString} fix fee ${ethers.utils.formatEther(fixFee)}`)
        let ratioFee = await tw.feeRatioM(usdt, chainId)
        console.log(`ratio fee ${ethers.utils.formatEther(ratioFee)}`)
        token0s.push(usdt)
        chainNumbers.push(chainId)
        if (cChainName == 'mainnet') {
            fixAmounts.push(ethers.utils.parseUnits("100", await usdtToken.decimals()))
        } else if (cChainName == 'boba' || cChainName == 'op' || cChainName == 'arbi'){
            fixAmounts.push(ethers.utils.parseUnits("10", await usdtToken.decimals()))
        } else {
            fixAmounts.push(ethers.utils.parseUnits("2", await usdtToken.decimals()))
        }
        // fixAmounts.push(0)
        ratioAmounts.push(ethers.utils.parseEther("0.005"))
    }
    console.log(token0s, chainNumbers, fixAmounts, ratioAmounts)
    let tx = await tw.setFees(token0s, chainNumbers, fixAmounts, ratioAmounts)
    console.log(tx.hash, token0s, chainNumbers, fixAmounts, ratioAmounts)
    await tx.wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
