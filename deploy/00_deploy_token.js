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
    // const {
    //     deployer,
    //     crosser1,
    //     crosser2
    // } = await ethers.getNamedSigners();
    const { deployer } = await getNamedAccounts();
    console.log(`${deployer} in ${network.name}`)
    let token_eth;
    let token_bsc;
    if (network.name === "ropsten" || network.name === "kovan") {
        await deploy("FIN", {
            contract: "Token",
            from: deployer,
            log: true,
            args: ['DeFiner Token', 'FIN', deployer],
        })
    } else if (network.name == "bsc") {
        await deploy("TokenBoring", {
            contract: "Token",
            from: deployer,
            log: true,
            args: ['BoringDAO', 'BORING', 18, deployer],
        })
    } else if (network.name == "bsc_test" || network.name == "okex_test" || network.name == "okex") {
        await deploy("TokenBoring", {
            contract: "Token",
            from: deployer,
            log: true,
            args: ['BoringDAO', 'BORING', 18, deployer]
        })
    }
}

module.exports.tags = ['00']