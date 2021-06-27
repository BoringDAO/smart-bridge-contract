const { task } = require("hardhat/config")

task("token:grant", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("BoringToken")
        const token = Token.attach("0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9")
        const role = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const account = "0x60E76dC9B7369293B364186EcCad993dE205d228"
        await (await token.grantRole(role, account)).wait()
    })

task("token:mint", "Mint token")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("BoringToken")
        const token = Token.attach("0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9")
        const role = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const account = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
        await (await token.mint(account, ethers.utils.parseEther("100"))).wait()
    })
task("token:burn", "Burn token")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("BoringToken")
        const token = Token.attach("0xdffD2d16B1F9bF1b27d810DC4312C5b52C25a6E9")
        const role = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const account = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
        await (await token.mint(account, ethers.utils.parseEther("100"))).wait()
    })
task("token:data", "Display view data")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("BoringToken")
        const token = Token.attach("0xb78d5C8817bf0985932115B7700194ffCD79AfB3")
        const role = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const account = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
        console.log(await token.decimals())
    })

task("token:balance", "Query balance")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("BoringToken")
        const token = Token.attach("0x7bB69e23afD93188a3bb1b778Ff70c44510Fa946")
        console.log((await token.balanceOf("0xF496D594035628AAD0380a97E9E27fafB3379052")).toString())
    })

