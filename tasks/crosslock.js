const { task } = require("hardhat/config")

task("crosslock:add", "Add supporting token")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock");
        const crossLock = CrossLock.attach("0x3b59f709C669bAd4535ED1366cE5f7Ee3e8B9B5A")
        // const bridge = await ethers.getContract("CrossLock")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const token1 = "0x26Ec036Be42907eA15a273833816539B26d2BE53"
        await (await crossLock.addSupportToken(token0, token1, 1666700000)).wait()
    })

task("crosslock:unlock", "Unlock token")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        await (await bridge.addSupportToken("0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee", "0x19783469f2485b702b89f98A64F2179877D0391E")).wait()
    })

task("crosslock:getRoleKey", "Get role key")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const token1 = "0x26Ec036Be42907eA15a273833816539B26d2BE53"
        console.log(await bridge.getRoleKey(token0, token1, 1666700000))
    })

task("crosslock:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const CrossLock = await ethers.getContractFactory("CrossLock")
        const crossLock = CrossLock.attach("0x3b59f709C669bAd4535ED1366cE5f7Ee3e8B9B5A")
        const role = "0x2d89bfa28f0d9be284ad9dd32d89569cb148a399b75115ab2130fed21b633fb7"
        const account = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
        await (await crossLock.grantRole(role, account)).wait()
    });

task("crosslock:setThreshold", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        await (await bridge.setThreshold(token0, 1)).wait()
    })
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

task("multicall:getEthBalance", "Get eth balance")
    .setAction(async function (args, { ethers }, runSuper) {
        const multicall = await ethers.getContract("Multicall")
        console.log((await multicall.getEthBalance("0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429")).toString())
    })