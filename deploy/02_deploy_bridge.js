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
    let token0 = ""
    let token1 = ""
    let feeto0 = crosser1.address
    let feeto1 = crosser2.address
    if (network.name === 'bsc_test') {
        token0 = "0x713e821ef3c51283f2e9925253b075469ac486ed";
        token1 = "0xbfC0b0f561497e2D01C3eb4E3fBEA19f878048Be";
        await deploy('Bridge', {
            from: deployer.address,
            log: true,
            args: [[crosser1.address, crosser2.address], token0, token1, [feeto0, feeto1]] 
        })
        await execute("Bridge", {from: deployer.address, log: true}, "setFee", ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"))
    }
}

module.exports.tags = ["Bridge"]