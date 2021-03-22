const {
    ethers,
    network
} = require("hardhat");

module.exports = async ({
    deployments
}) => {
    const {
        deploy,
        get
    } = deployments;
    const {
        deployer,
        crosser1,
        crosser2
    } = await ethers.getNamedSigners();
    let token_eth;
    let token_bsc;
    if (network.name === "ropsten") {
        let result = await deploy("TestITokenETH", {
            from: deployer.address,
            args: ['TestToken', 'TT']
        })

    } else if (network.name == "mainnet") {

    } else if (network.name == "bsc_test") {
        let result = await deploy("TestITokenBSC", {
            from: deployer.address,
            logs: true,
            args: ['TestToken', 'TT', deployer.address]
        })
    }
}

module.exports.tags = ['Token']