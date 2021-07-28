const { task } = require("hardhat/config")

let token0, pairName, pair, chainID;

task("pegswap:prepare", "Prepare")
    .setAction(async function (args, { ethers, network, run }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const pegSwap = await ethers.getContract("PegSwap")
        console.log(`PegSwap: ${pegSwap.address}`)

        if (network.name === 'kovan') {
            token0 = "0x9A204A98fa6A8ac990d7FB3D98245a997622e122"
            pairName = "USDT-PSP-BSC"
            pair = "0x26EA73Df819d7290C314A36F386E3bE2F8daf897"
            chainID = 97
        } else if (network.name === 'bsc_test') {
            token0 = "0x6D2F93F83ECCA6d6Dc0A72426a55A5CE83819a35"
            pairName = "USDT-PSP-ETH"
            pair = "0x730ec8B7B9D3eC7a853e27a0F38c00a6182F40D9"
            chainID = 42
        }

        // await run("pegswap:setPegProxy")
        // await run("pegswap:addPair")
        // await run("pair:setPegSwap")
        await run("pegswap:setRemovalMinimum")
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

task("pegswap:setRemovalMinimum", "Set removal minimum")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pegSwap.setRemovalMinimum(token0, "1000000")).wait()
        console.log(`SetRemovalMinimum(token0: ${token0})`)
    });