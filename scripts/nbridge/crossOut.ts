import { crossOutUSDT, getUSDTLiquidity, getCrossUSDTResult } from '@boringdao/boringdao-sdk'
import { JsonRpcSigner } from '@ethersproject/providers'
import { ethers, Signer } from 'ethers'
import { ERC20 } from '../../src/types/ERC20'
import { attach } from '../helper'


async function main() {

	// Source chain provider with account
	// const provider = new ethers.providers.Web3Provider(window.ethereum)

	const provider = new ethers.providers.JsonRpcProvider(
		'https://polygon-mainnet.g.alchemy.com/v2/',
		137
	)
	let wallet = new ethers.Wallet("", provider)


	// Destination chain provider
	const targetProvider = new ethers.providers.JsonRpcProvider(
		'https://bsc-dataseed.binance.org/',
		56
	)

	// 1. Get USDT liquidity (Ethereum -> BSC)
	const liquidity = await getUSDTLiquidity(provider, targetProvider, 137, 56)
	console.log(liquidity.toString())

	// 2. Get cross-chain fee (Ethereum -> BSC, 100 USDT)
	const result = await getCrossUSDTResult(provider, targetProvider, 137, 56, "10")
	console.log(result[0].toString()) // Cross-chain fee
	console.log(result[1].toString()) // The USDT amount that user will get at destination chain(BSC)

	// 3. Cross USDT (Ethereum -> BSC, 100 USDT)
	let tx = await crossOutUSDT(
		wallet,
		137,
		56,
		"",
		"",
		"10"
	)
	console.log(tx.transactionHash)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});