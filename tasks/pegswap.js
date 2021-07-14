const { task } = require("hardhat/config")

const token0 = "0x9A204A98fa6A8ac990d7FB3D98245a997622e122"
const pairName = "USDT-PSP-BSC"
const pair = "0xd22385B41a54685FaA3C7863F8d02009D84F7491"
const chainID = 97

task("pegswap:prepare", "Prepare")
    .setAction(async function (args, { ethers, run }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const pegSwap = await ethers.getContract("PegSwap")
        console.log(`PegSwap: ${pegSwap.address}`)

        await run("pegswap:setPegProxy")
        // await run("pegswap:addPair")
        // await run("pair:setPegSwap")
    })

task("pair:setPegSwap", "Set pegSwap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pair = await ethers.getContract(pairName)
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pair.setPegSwap(pegSwap.address)).wait()
        console.log(`Set pegSwap: ${pegSwap.address}`)
    })

task("pegswap:setPegProxy", "Set pegProxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pegSwap.setPegProxy(pegProxy.address)).wait()
        console.log(`Set pegProxy: ${pegProxy.address}`)
    })

task("pegswap:addPair", "Add support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pegSwap.addPair(token0, pair, chainID)).wait()
        console.log(`Add pair(token0: ${token0}, pair: ${pair}, chainID: ${chainID})`)
    });

task("pegswap:removePair", "Remove support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pegSwap.removePair(token0, chainID)).wait()
    });

task("pegswap:getPair", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        console.log(await pegSwap.getPair(token0, chainID))
    });

task("pegswap:getMaxToken0", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        console.log((await pegSwap.getMaxToken0AmountOut(token0, chainID)).toString())
    });

task("pegswap:getMaxToken1", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        console.log((await pegSwap.getMaxToken1AmountOut(token0, chainID)).toString())
    });