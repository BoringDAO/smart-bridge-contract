const {
    ethers,
    network
} = require("hardhat");

module.exports = async ({
    deployments,
    getNamedAccounts,
}) => {
    const {
        deploy,
        get,
    } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(`${deployer} in ${network.name}`)
    await deploy("Multicall", {
        from: deployer,
        log: true
    })
}

module.exports.tags = ['05']