const { task } = require("hardhat/config")

const bridgeAddress = "0x2CDAb8942b09bAF07E76F8B5b97fdF72140064aB"
const token0 = "0x13edDC17aE2257e4F06105822330E4a5DcED36e2"
const token1 = "0x3de3Add2B44bF4cDa453eA9deb812aa0582928Ee"

task("bridge:addSupportToken", "Add support token")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        await (await bridge.addSupportToken(token0, token1)).wait()
    })

task("bridge:addFeeTo", "Add feeTo")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        const account = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
        await (await bridge.addFeeTo(token0, account)).wait()
    });

task("bridge:setFee", "Set fee")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        await (await bridge.setFee(token0, ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"))).wait()
    });

task("bridge:setThreshold", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        await (await bridge.setThreshold(token1, 1)).wait()
    });

task("bridge:getRoleKey", "Get role key")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        console.log(await bridge.getRoleKey(token0, token1))
    });

task("bridge:grantRole", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const Bridge = await ethers.getContractFactory("Bridge")
        const bridge = Bridge.attach(bridgeAddress)
        const role = "0x48d7f72973d411f0675c5bbfceb71a69a560492cf4943a84d017f6e7bee4d2b3"
        const account = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
        await (await bridge.grantRole(role, account)).wait()
    });

task("token:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("Token")
        const token = Token.attach("0x3de3Add2B44bF4cDa453eA9deb812aa0582928Ee")
        const minter = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const burner = "0x4255524e45525f524f4c45000000000000000000000000000000000000000000"
        await (await token.grantRole(minter, bridgeAddress)).wait()
        await (await token.grantRole(burner, bridgeAddress)).wait()
    });