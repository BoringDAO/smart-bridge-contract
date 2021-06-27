const { task } = require("hardhat/config")

const lockAddress = "0x3b59f709C669bAd4535ED1366cE5f7Ee3e8B9B5A"
const token0 = "0x13edDC17aE2257e4F06105822330E4a5DcED36e2"
const token1 = "0x3de3Add2B44bF4cDa453eA9deb812aa0582928Ee"
const chainID = 65

task("crosslock:add", "Add supporting token")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock")
        const crossLock = CrossLock.attach(lockAddress)
        await (await crossLock.addSupportToken(token0, token1, chainID)).wait()
    })

task("crosslock:setThreshold", "Add supporting token")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock")
        const crossLock = CrossLock.attach(lockAddress)
        await (await crossLock.setThreshold(token0, 1)).wait()
    })

task("crosslock:unlock", "Unlock token")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        await (await bridge.addSupportToken("0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee", "0x19783469f2485b702b89f98A64F2179877D0391E")).wait()
    })

task("crosslock:getRoleKey", "Get role key")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock")
        const crossLock = CrossLock.attach(lockAddress)
        console.log(await crossLock.getRoleKey(token0, token1, chainID))
    })

task("crosslock:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock")
        const crossLock = CrossLock.attach(lockAddress)
        const role = "0x48d7f72973d411f0675c5bbfceb71a69a560492cf4943a84d017f6e7bee4d2b3"
        const account = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
        await (await crossLock.grantRole(role, account)).wait()
    });

task("crosslock:unlock", "Unlock")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const from = "0xfE20406b7878faA336d80Ce48f66f7021cfb03Ec"
        const to = "0xfE20406b7878faA336d80Ce48f66f7021cfb03Ec"
        const amount = "1000000000000000000"
        const txid = "0xbbe53a178b6a3a86a5330ada1186386e5b2f518645f32424882fc18505eced11"
        await (await bridge.unlock(token0, 97, from, to, amount, txid)).wait()
    })