
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("BoringUSDT", {
        contract: "BoringToken",
        from: deployer,
        args: ["Boring Tether USD Token", "BoringUSDT", 18],
        log: true,
    })
}

module.exports.tags = ["BoringToken"]