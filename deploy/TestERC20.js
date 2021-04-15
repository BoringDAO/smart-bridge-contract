
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("TestERC20", {
        from: deployer,
        args: ["DAI Token", "DAI"],
        log: true,
    })
}

module.exports.tags = ["TestERC20"]