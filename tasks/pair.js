const { task } = require("hardhat/config")

// kovan
// const pairAddress = "0x98A866258926FA7042eA441F855b8e02f91AE65C"
// const swapAddress = "0xBbe0f8280283721081991059a02Fa75407A7c47A"

// bsc_test
const swapAddress = "0xdB6679478D74Ba4BBE4c0D3089161176844C7E90"
const pairAddress = "0x9D050Da7272F428b3cA14E892e5e87E5CA4D6DcB"

task("pair:mint", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const Pair = await ethers.getContractFactory("PegSwapPair")
        const pair = Pair.attach("0xb78d5C8817bf0985932115B7700194ffCD79AfB3")
        await (await pair.mint("0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429", {
            gasLimit: 12487794
        })).wait()
    });

task("pair:setPegSwap", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const Pair = await ethers.getContractFactory("PegSwapPair")
        const pair = Pair.attach(pairAddress)
        await (await pair.setPegSwap(swapAddress)).wait()
    })

task("pair:data", "Get support token to pegswap")
    .setAction(async function (args, { ethers }, runSuper) {
        const Pair = await ethers.getContractFactory("PegSwapPair")
        const pair = Pair.attach("0x9D050Da7272F428b3cA14E892e5e87E5CA4D6DcB")
        const result = await pair.getReserves()
        console.log(result[0].toString())
        console.log(result[1].toString())
        console.log(await pair.token0())
        console.log(await pair.token1())
    })