
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("USDT", {
        contract: 'TestERC20',
        from: deployer,
        args: ["Tether USD Token", "USDT", 6],
        log: true,
    })
}

module.exports.tags = ["TestERC20"]