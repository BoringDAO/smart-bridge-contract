const { task } = require("hardhat/config")

task("pegproxy:setPegSwap", "Set pegSwap")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        await (await pegProxy.setPegSwap("")).wait()
    })

task("pegproxy:add", "Add support token to pegproxy")
    .setAction(async function (args, { ethers }, runSuper) {
        const pegProxy = await ethers.getContract("PegProxy")
        const token0 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
        const token1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
        await (await pegProxy.addSupportToken(token0, token1)).wait()
    });