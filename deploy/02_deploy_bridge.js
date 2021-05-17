const { network, ethers } = require("hardhat");

module.exports = async ({
    deployments,
    run
}) => {
    const {
        deploy,
        get,
        execute
    } = deployments;
    const {
        deployer,
        crosser1,
        crosser2
    } = await ethers.getNamedSigners();
    console.log(`deployer ${deployer.address} `)
    let token0 = ""
    let token1 = ""
    let feeto0 = crosser1.address
    // let feeto1 = crosser2.address
    switch (network.name) {
        case "bsc_test":
            token0 = "0x713e821ef3c51283f2e9925253b075469ac486ed";
            token1 = "0xbfC0b0f561497e2D01C3eb4E3fBEA19f878048Be";
            break
        case "okex_test":
            token0 = "0xC877Ec4f22317A30BA04A17796d4497490A76e22"
            token1 = (await get("TokenBor")).address
            break
        case "okex":
            token0 = "0x3c9d6c1C73b31c837832c72E04D3152f051fc1A9"
            token1 = (await get("TokenBor")).address
            break
    }
    await deploy('Bridge', {
        from: deployer.address,
        log: true,
    })
    // await execute("Bridge", { from: deployer.address, log: true }, "setFee", ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"))
}

module.exports.tags = ["02"]