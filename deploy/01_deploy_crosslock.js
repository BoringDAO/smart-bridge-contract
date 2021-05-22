const {
    ethers,
    network
} = require("hardhat");

module.exports = async ({
    deployments,
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

    let fromToken;
    let toToken;
    if (network.name === "ropsten") {
        fromToken = "0x713e821ef3c51283f2e9925253b075469ac486ed";
        toToken = "0xbfC0b0f561497e2D01C3eb4E3fBEA19f878048Be";
    } else if (network.name === "mainnet") {
        fromToken = await ethers.getContractAt("TestIToken", "")
        // just for test 
        totoken = '0xD6Ff436ddD8E87Aa368715F1E1C873fbECccfD2f'
    }
    console.log(`deployer:${deployer.address} at ${network.name}`)
    let result = await deploy('CrossLock', {
        from: deployer.address,
        log: true,
    });
    // await execute("CrossLock", {
    //     from: deployer.address,
    //     log: true
    // }, "addSupportToken", fromToken, toToken, roleFlag)
    // await execute("CrossLock", { from: deployer.address, log: true }, "grantRole", roleFlag, crosser1.address)
    // await execute("CrossLock", { from: deployer.address, log: true }, "grantRole", roleFlag, crosser2.address)
};

module.exports.tags = ["CrossLock"]