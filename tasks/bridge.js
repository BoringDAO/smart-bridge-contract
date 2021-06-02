const { task } = require("hardhat/config")

task("bridge:addSupportToken", "Add support token")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        await (await bridge.addSupportToken("0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee", "0x19783469f2485b702b89f98A64F2179877D0391E")).wait()
    })

task("bridge:addFeeTo", "Add feeTo")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const account = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"
        await (await bridge.addFeeTo(token0, account)).wait()
    });

task("bridge:setFee", "Set fee")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        await (await bridge.setFee(token0, ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"))).wait()
    });

task("bridge:setThreshold", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        const token1 = "0x19783469f2485b702b89f98A64F2179877D0391E"
        await (await bridge.setThreshold(token1, 1)).wait()
    });

task("bridge:getRoleKey", "Get role key")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
        const token1 = "0x19783469f2485b702b89f98A64F2179877D0391E"
        console.log(await bridge.getRoleKey(token0, token1))
    });

task("bridge:grantRole", "Set threshold")
    .setAction(async function (args, { ethers }, runSuper) {
        const bridge = await ethers.getContract("Bridge")
        const role = "0xf11bf7e64dc3c41a6733f2f2c153944170a68e2bd88875b880b7e4c89fe426b1"
        const account = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
        await (await bridge.grantRole(role, account)).wait()
    });

task("token:grantRole", "Grant role")
    .setAction(async function (args, { ethers }, runSuper) {
        const Token = await ethers.getContractFactory("Token")
        const token = Token.attach("0x26Ec036Be42907eA15a273833816539B26d2BE53")
        const minter = "0x4d494e5445525f524f4c45000000000000000000000000000000000000000000"
        const burner = "0x4255524e45525f524f4c45000000000000000000000000000000000000000000"
        const bridge = "0x34fbE21c1d94084697C5Cc0cbCe2eFA1418f4384"
        await (await token.grantRole(minter, bridge)).wait()
        await (await token.grantRole(burner, bridge)).wait()
    });