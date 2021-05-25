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
        read,
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
        // just for test 
        fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
        // fromToken = "0x78e1d16ba607c61bccfe23ba3b3369ad44df960f"
        toToken = '0x555B326dBc2a9634E4E82ab644e72296A8f3E9b9'
    }
    console.log(`deployer:${deployer.address} at ${network.name}`)
    let result = await deploy('CrossLock', {
        from: deployer.address,
        log: true,
    });
    await execute("CrossLock", {
        from: deployer.address,
        log: true
    }, "addSupportToken", fromToken, toToken, 66)
    let roleKey = await read("CrossLock", "getRoleKey", fromToken, toToken, 66)
    console.log(`role key ${roleKey}`)
    await execute("CrossLock", { from: deployer.address, log: true }, "grantRole", roleKey, "0xbC41ef18DfaE72b665694B034f608E6Dfe170149")
    await execute("CrossLock", { from: deployer.address, log: true }, "setThreshold", fromToken, 1)
};

module.exports.tags = ["04"]