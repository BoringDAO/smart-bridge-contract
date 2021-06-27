const { task } = require("hardhat/config")

// kovan
// const proxyAddress = "0xF496D594035628AAD0380a97E9E27fafB3379052"
// const swapAddress = "0xBbe0f8280283721081991059a02Fa75407A7c47A"
// const token0 = "0x7bB69e23afD93188a3bb1b778Ff70c44510Fa946"
// const pair = "0x98A866258926FA7042eA441F855b8e02f91AE65C"

// bsc_test
const proxyAddress = "0x2d3a59cdF02A8f0199B550eAA6598287220d1aa8"
const swapAddress = "0xdB6679478D74Ba4BBE4c0D3089161176844C7E90"
const token0 = "0x58976823450D3AeF1D63E883D106FAca41973321"
const pair = "0x9D050Da7272F428b3cA14E892e5e87E5CA4D6DcB"

task("pegswap:addPair", "Add support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach(swapAddress)
        await (await pegSwap.addPair(token0, pair)).wait()
    });

task("pegswap:setPegProxy", "Add support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const pegSwap = PegSwap.attach(swapAddress)
        await (await pegSwap.setPegProxy(proxyAddress)).wait()
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
        const pegSwap = PegSwap.attach(swapAddress)
        const token0 = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
        console.log(await pegSwap.getPair(token0))
    });
;

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