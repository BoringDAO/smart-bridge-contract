const { task } = require("hardhat/config")

const proxyAddress = "0x4b8832f9E22928f2De2DF6Fc1313F3eB079024Ad"
const swapAddress = "0xdB6679478D74Ba4BBE4c0D3089161176844C7E90"

task("pair:data", "Display all view data")
    .setAction(async function (args, { ethers }, runSuper) {
        const pair = await ethers.getContract("USDT-PegSwapPair")
        console.log("token0: ", await pair.token0())
        console.log("token1: ", await pair.token1())
    })