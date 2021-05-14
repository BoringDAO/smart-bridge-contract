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
    if (network.name === "ropsten") {
        // let result = await deploy("TestITokenETH", {
        //     from: deployer.address,
        //     args: ['TestToken', 'TT']
        // })

    } else if (network.name == "mainnet") {

    } else if (network.name == "bsc_test" || network.name == "okex_test" || network.name == "okex") {
        await deploy("TokenBor", {
            contract: "Token",
            from: deployer,
            log: true,
            args: ['BoringDAO Token', 'BOR', 18, deployer]
        })
    }
}

module.exports.tags = ['00']