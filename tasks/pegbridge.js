const { task } = require("hardhat/config")

const proxyAddress = "0x4b8832f9E22928f2De2DF6Fc1313F3eB079024Ad"
const swapAddress = "0xdB6679478D74Ba4BBE4c0D3089161176844C7E90"

task("pegproxy:setPegSwap", "Set pegSwap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        await (await pegProxy.setPegSwap(swapAddress)).wait()
    })

task("pegproxy:add", "Add support token to pegproxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        const token0 = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
        const token1 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        await (await pegProxy.addSupportToken(token0, token1)).wait()
    });

task("pegswap:addPair", "Add support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach("0xBbe0f8280283721081991059a02Fa75407A7c47A")
        const token0 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        const pair = "0xb78d5C8817bf0985932115B7700194ffCD79AfB3"
        await (await pegSwap.addPair(token0, token1)).wait()
    });

task("pegswap:removePair", "Remove support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach("0xBbe0f8280283721081991059a02Fa75407A7c47A")
        const token0 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        await (await pegSwap.removePair(token0)).wait()
    });

task("pegswap:getPair", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach("0xBbe0f8280283721081991059a02Fa75407A7c47A")
        const token0 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        console.log(await pegSwap.getPair(token0))
    });

task("pair:getReserves", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const Pair = await ethers.getContractFactory("PegSwapPair")
        const pair = Pair.attach("0xb78d5C8817bf0985932115B7700194ffCD79AfB3")
        console.log((await pair.getReserves())[1].toString())
    });
task("pair:mint", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const Pair = await ethers.getContractFactory("PegSwapPair")
        const pair = Pair.attach("0xb78d5C8817bf0985932115B7700194ffCD79AfB3")
        await (await pair.mint("0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429", {
            gasLimit: 12487794
        })).wait()
    });

task("pegswap:addLiquidity", "Add support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach("0xBbe0f8280283721081991059a02Fa75407A7c47A")
        const token0 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        console.log(ethers.utils.parseUnits("1", 8).toString())
        try {
            await (await pegSwap.addLiquidity(token0, ethers.utils.parseUnits("1", 8), "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429", {
                gasLimit: 12487794
            })).wait()
        } catch (e) {
            console.error(e)
        }
    });