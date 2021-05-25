const { utils } = require("ethers");
const { ethers } = require("hardhat");

module.exports = async({
    deployments,
    run
}) => {
    const {deploy, execute, get} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const dep_bridge = await get("Bridge")
    console.log(`dep ${dep_bridge.address}`)
    // await execute("TokenBoring", {
    //     from: deployer.address,
    //     log: true
    // }, "setMinter", dep_bridge.address)
    const minter = utils.formatBytes32String("MINTER_ROLE")
    const burner = utils.formatBytes32String("BURNER_ROLE")
    await execute("TokenBoring", {from: deployer.address, log: true}, "grantRole", minter, dep_bridge.address)
    await execute("TokenBoring", {from: deployer.address, log: true}, "grantRole", burner, dep_bridge.address)
}

module.exports.tags = ['03']