
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("BoringUSDT-ETH", {
        contract: "BoringToken",
        from: deployer,
        args: ["Boring Tether USD Token", "BoringUSDT-ETH", 6],
        log: true,
    })
}

module.exports.tags = ["BoringToken"]