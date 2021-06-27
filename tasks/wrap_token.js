const { task } = require("hardhat/config")

const tokenAddress = "0x3de3Add2B44bF4cDa453eA9deb812aa0582928Ee"
const dispatcher = "0x1e3cE1cAcC9e98680B602261A1DE428D3F04A53b"

task("wrap:setDispatcher", "Set dispatcher")
    .setAction(async function (args, { ethers }, runSuper) {
        const WrapToken = await ethers.getContractFactory("WrapToken")
        const wrapToken = WrapToken.attach(tokenAddress)
        await (await wrapToken.setDispatcher(dispatcher)).wait()
    });