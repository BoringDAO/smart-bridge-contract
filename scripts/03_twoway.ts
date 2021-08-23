import { run, ethers, network } from 'hardhat';
import { attach, deploy, setTwoWay } from './helper';
import { TestERC20 } from '../src/types/TestERC20';
import { TwoWay } from '../src/types/TwoWay';
import { SwapPair } from '../src/types/SwapPair';
import { ERC20 } from '../src/types/ERC20';
import { BoringToken } from '../src/types/BoringToken';
import { parseEther } from '@ethersproject/units';

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = await accounts[0].getAddress();

    const usdtBSCAddr = '';
    const usdtOkexAddr = '';

    console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`);

    // await crossOut(network.name, '30000', 'matic_test', deployer)
    // process.exit(0)

    // let crosser = '0xc38068d89b16a1dae117974f30230f4afd654b3c';
    let crosser = '0x2353178C6c05378812f024A783541857634A1e82';
    let feeToDev
    let targetChains:string[] = [];
    console.log(network.name, 'target chain', targetChains);
    switch (network.name) {
        case 'okex_test':
            targetChains = ['matic_test', 'bsc_test', 'kovan', 'avax_test']
            await addPair(network.name, targetChains, deployer, crosser)
            break;
        case 'bsc_test':
            targetChains = ['matic_test', 'okex_test', 'kovan', 'avax_test']
            await addPair(network.name, targetChains, deployer, crosser)
            break;
        case 'matic_test':
            targetChains = ['bsc_test', 'okex_test', 'kovan', 'avax_test']
            await addPair(network.name, targetChains, deployer, crosser)
            break;
        case 'kovan':
            targetChains = ['bsc_test', 'okex_test', 'matic_test', 'avax_test']
            await addPair(network.name, targetChains, deployer, crosser)
            break
        case 'avax_test':
            targetChains = ['bsc_test', 'okex_test', 'matic_test', 'kovan']
            await addPair(network.name, targetChains, deployer, crosser)
            break
        case 'okex':
            // targetChain = 'bsc'
            targetChains = ['bsc', 'matic']
            feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
            crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
            await addPair(network.name, targetChains, feeToDev, crosser)
            break;
        case 'bsc':
            // targetChain = 'okex'
            targetChains = ['matic', 'okex']
            feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
            crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
            await addPair(network.name, targetChains, feeToDev, crosser)
            break;
        case 'matic':
            // targetChain = 'bsc'
            targetChains = ['bsc', 'okex']
            feeToDev = '0x09587012B3670D75a90930be9282d98063E402a2'
            crosser = '0x9037772a588A2b6725fe2360c0356B7f0140b5d2'
            await addPair(network.name, targetChains, feeToDev, crosser)
            break
        default:
            console.error('Not known network');
    }
}

async function addPair(sourceChain: string, targetChains: string[], feeToDev: string, crosser: string) {
    console.log(`source chain ${sourceChain}, target chain ${targetChains}`)
    let targetChainIDs: number[] = []
    let targetUSDTAddrs: string[] = []
    for (let chainName of targetChains ) {
        let chainID = getChainId(chainName);
        targetChainIDs.push(chainID) 

        let targetUSDTAddr = getUsdt(chainName);
        targetUSDTAddrs.push(targetUSDTAddr)
    }
    let sourceUSDTAddr = getUsdt(sourceChain)
    let twoWay: TwoWay
    let twoWayAddr = getTwoWayAddr(sourceChain)
    if (twoWayAddr === '') {
        twoWay = (await deploy('TwoWay', feeToDev)) as TwoWay;
    } else {
        twoWay = (await ethers.getContractAt('TwoWay', twoWayAddr)) as TwoWay
    }
    let usdt = (await ethers.getContractAt('TestERC20', sourceUSDTAddr)) as ERC20;
    // let swapPair = (await deploy('SwapPair', 'TwoWay LP', 'TLP', usdt.address)) as SwapPair;
    // let boringUSDT = (await ethers.getContractAt('BoringToken', '0xcf83FE4d666Adc4605c381A02D54f7990F9adBee')) as BoringToken
    let swapPair = (await ethers.getContractAt('SwapPair', '0x5B62442638e6595e45Ce7CBdEAc84E23f398E012')) as SwapPair
    await setTwoWay(usdt, twoWay, swapPair, targetChainIDs, usdt.address, targetUSDTAddrs, crosser, '0.5', '0', '0');
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
        case 'bsc':
            return 56
        case 'okex':
            return 66
        case 'matic':
            return 137
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
        case 'bsc':
            return '0x55d398326f99059ff775485246999027b3197955'
        case 'okex':
            return '0x382bB369d343125BfB2117af9c149795C6C65C50'
        case 'matic':
            return '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
        case 'avax':
            return '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
        case 'mainnet':
            return '0xdac17f958d2ee523a2206206994597c13d831ec7'
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
            return '0x6fE083cFeDD7C0052bf514194Db673975f1d0a0B';
        case 'avax_test':
            return '';
        case 'bsc':
            return '0xcA8Eaee513fF3980B886505EbcfFeCD74CECe88F';
        case 'matic':
            return '0x45c0ABE077bB35AE1868DF42A7175a989Cccb0E3';
        case 'okex':
            return '0x8b5de97Ba8F7b10bb415E7f58dd6D6477874E9D7'
        case 'mainnet':
            return '';
        case 'avax':
            return '';
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

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
