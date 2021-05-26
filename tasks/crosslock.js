const { task } = require("hardhat/config")

task("crosslock:add", "Add supporting token")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const token1 = "0x9a40dB98775015EB2452754e905e22E087ad3842"
        await (await bridge.addSupportToken(token0, token1, 97)).wait()
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
        const token1 = "0x9a40dB98775015EB2452754e905e22E087ad3842"
        console.log(await bridge.getRoleKey(token0, token1, 97))
    })

task("crosslock:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("CrossLock")
        const role = "0x28ad7191b4248ef03c50f1c9e5d9b3d6ae5c07a09e8734296def3a69561ab32c"
        const account = "0x60E76dC9B7369293B364186EcCad993dE205d228"
        await (await bridge.grantRole(role, account)).wait()
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