const { task } = require("hardhat/config")

// kovan
const proxyAddress = "0xF496D594035628AAD0380a97E9E27fafB3379052"
const swapAddress = "0xBbe0f8280283721081991059a02Fa75407A7c47A"
const token0 = "0x7bB69e23afD93188a3bb1b778Ff70c44510Fa946"
const token1 = "0x58976823450D3AeF1D63E883D106FAca41973321"

// bsc_test
// const proxyAddress = "0x2d3a59cdF02A8f0199B550eAA6598287220d1aa8"
// const swapAddress = "0xdB6679478D74Ba4BBE4c0D3089161176844C7E90"
// const token0 = "0x58976823450D3AeF1D63E883D106FAca41973321"
// const token1 = "0x7bB69e23afD93188a3bb1b778Ff70c44510Fa946"

task("pegproxy:setPegSwap", "Set pegSwap")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        await (await pegProxy.setPegSwap(swapAddress)).wait()
    })

task("pegproxy:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        const role = "0x43524f535345525f524f4c450000000000000000000000000000000000000000"
        const node = "0xc38068d89b16a1dae117974f30230f4afd654b3c"
        await (await pegProxy.grantRole(role, node)).wait()
    })

task("pegproxy:prepare", "Prepare")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const PegSwap = await ethers.getContractFactory("PegSwap")
        const Token = await ethers.getContractFactory("Token")

        const pegProxy = PegProxy.attach(proxyAddress)
        const token0 = "0x7bB69e23afD93188a3bb1b778Ff70c44510Fa946"
        const token1 = Token.attach("0x1867a7B29342F2157DB8948C9F2e59dB18E6481E")
        const pegSwap = PegSwap.attach(swapAddress)

        const role = "0x43524f535345525f524f4c450000000000000000000000000000000000000000"
        const burnRole = "0x4255524e45525f524f4c45000000000000000000000000000000000000000000"
        const node = "0xc38068d89b16a1dae117974f30230f4afd654b3c"
        const mintRole = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"

        // await (await pegProxy.grantRole(role, node)).wait()
        await (await pegProxy.setThreshold(token0, 1))
        // await (await pegProxy.setPegSwap(swapAddress)).wait()
        // await (await token1.grantRole(mintRole, proxyAddress)).wait()
        // await (await token1.grantRole(burnRole, proxyAddress)).wait()
        // await (await pegSwap.setPegProxy(proxyAddress)).wait()
    })

task("pegproxy:add", "Add support token to pegproxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        await (await pegProxy.addSupportToken(token0, token1)).wait()
    });

task("pegproxy:remove", "Remove support token to pegproxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        const token0 = "0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9"
        await (await pegProxy.removeSupportToken(token0)).wait()
    });

task("pegproxy:data", "Display view data")
    .setAction(async function (args, { ethers }, runSuper) {
        const PegProxy = await ethers.getContractFactory("PegProxy")
        const pegProxy = PegProxy.attach(proxyAddress)
        console.log(await pegProxy.supportToken(token0))
    });

