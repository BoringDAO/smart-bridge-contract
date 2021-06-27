
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("FIN", {
        contract: "TestERC20",
        from: deployer,
        args: ["DeFiner Token", "FIN"],
        log: true,
    })
}

module.exports.tags = ["TestERC20"]