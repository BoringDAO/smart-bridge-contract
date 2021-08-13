import { run, ethers, network } from 'hardhat';
import { attach, deploy, setTwoWay } from './helper';
import { TestERC20 } from '../src/types/TestERC20';
import { TwoWay } from '../src/types/TwoWay';
import { SwapPair } from '../src/types/SwapPair';
import { ERC20 } from '../src/types/ERC20';
import { BoringToken } from '../src/types/BoringToken';

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = await accounts[0].getAddress();

    const usdtBSCAddr = '';
    const usdtOkexAddr = '';

    console.log(`deployer ${await accounts[0].getAddress()} in network ${network.name}`);
    let twoWay: TwoWay;
    let usdt: ERC20;
    let boringUSDT: BoringToken;
    let swapPair: SwapPair;
    let usdtInBSC;
    let usdtInMatic;
	let crosser='0xc38068d89b16a1dae117974f30230f4afd654b3c';
	console.log(network.name)
    switch (network.name) {
        case 'okex_test':
            twoWay = (await deploy('TwoWay')) as TwoWay;
            break;
        case 'bsc_test':
            usdtInMatic = '0xCB7Bb6e911e79713A596731dc21D0a2EF24a4F74';
            // usdt = await deploy('TestERC20', 'TestERC20', 'USDT', 6) as ERC20
            usdt = (await ethers.getContractAt('TestERC20', '0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015')) as ERC20;
            boringUSDT = (await deploy('BoringToken', 'boringUSDT', 'boringUSDT', 18)) as BoringToken;
            twoWay = (await deploy('TwoWay', deployer)) as TwoWay;
            swapPair = (await deploy('SwapPair', 'TwoWay LP', 'TLP', usdt.address, boringUSDT.address)) as SwapPair;
            await setTwoWay(usdt, boringUSDT, twoWay, swapPair, 80001, usdt.address, usdtInMatic, crosser, '0.5', '0', '0');
            break;
        case 'matic_test':
            usdtInBSC = '0xB36c3713A6D46C67f55F6F49Ae0c47a61901F015';
            // usdt = (await deploy('TestERC20', 'TestERC20', 'USDT', 6)) as ERC20;
			usdt = (await ethers.getContractAt('TestERC20', '0xCB7Bb6e911e79713A596731dc21D0a2EF24a4F74')) as ERC20
            boringUSDT = (await deploy('BoringToken', 'boringUSDT', 'boringUSDT', 18)) as BoringToken;
            twoWay = (await deploy('TwoWay', deployer)) as TwoWay;
            swapPair = (await deploy('SwapPair', 'TwoWay LP', 'TLP', usdt.address, boringUSDT.address)) as SwapPair;
            await setTwoWay(usdt, boringUSDT, twoWay, swapPair, 97, usdt.address, usdtInBSC, crosser, '0.5', '0', '0');
            break;
        case 'okex':
            break;
        case 'bsc':
            break;
        default:
            console.error('Not known network');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
