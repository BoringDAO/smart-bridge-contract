const { ethers } = require("hardhat");

module.exports = async({
    deployments,
    run
}) => {
    const {deploy, execute, get} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const dep_bridge = await get("Bridge")
    console.log(`dep ${dep_bridge.address}`)
    await execute("TestITokenBSC", {
        from: deployer.address,
        log: true
    }, "setMinter", dep_bridge.address)
}

module.exports.tags = ['set_minter']