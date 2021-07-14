const { task } = require("hardhat/config")

const token0 = "0x6D2F93F83ECCA6d6Dc0A72426a55A5CE83819a35"
const token1 = "0x9A204A98fa6A8ac990d7FB3D98245a997622e122"
const chainID = 42
const role = "0x43524f535345525f524f4c450000000000000000000000000000000000000000"
const node = "0xc38068d89b16a1dae117974f30230f4afd654b3c"
const mintRole = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
const burnRole = "0x4255524e45525f524f4c45000000000000000000000000000000000000000000"

task("pegproxy:prepare", "Prepare")
    .setAction(async function (args, { ethers, run }, runSuper) {
        // await run("pegproxy:setPegSwap")
        await run("pegproxy:add")
        // await run("pegproxy:setThreshold")
        // await run("pegproxy:grant")
        // await run("boring:grant")
    })

task("boring:grant", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const boringToken = await ethers.getContract("BoringUSDT-ETH")
        const pegProxy = await ethers.getContract("PegProxy")
        console.log(`BoringToken: ${boringToken.address}`)
        console.log(`PegProxy address: ${pegProxy.address}`)
        await (await boringToken.grantRole(mintRole, pegProxy.address)).wait()
        await (await boringToken.grantRole(burnRole, pegProxy.address)).wait()
    })

task("pegproxy:support", "Support one token")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const pegSwap = await ethers.getContract("PegSwap")
        console.log(`PegProxy address: ${pegProxy.address}`)
        console.log(`PegSwap address: ${pegSwap.address}`)
        await (await pegProxy.setPegSwap(pegSwap.address)).wait()
    })

task("pegproxy:setPegSwap", "Set pegSwap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const pegSwap = await ethers.getContract("PegSwap")
        await (await pegProxy.setPegSwap(pegSwap.address)).wait()
        console.log(`Set pegSwap: ${pegSwap.address}`)
    })

task("pegproxy:add", "Add support token to pegproxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        await (await pegProxy.addSupportToken(token0, token1, chainID)).wait()
        console.log(`Add token(token0: ${token0}, token1: ${token1}, chainID: ${chainID})`)
    });

task("pegproxy:setThreshold", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        await (await pegProxy.setThreshold(token0, 1)).wait()
        console.log(`Set threshold(token0: ${token0}, count: 1)`)
    });

task("pegproxy:grant", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        await (await pegProxy.grantRole(role, node)).wait()
        console.log(`Grant(account: ${node}, role: ${role})`)
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