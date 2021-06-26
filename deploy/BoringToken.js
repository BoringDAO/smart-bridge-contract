
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("BoringUSDT", {
        contract: "BoringToken",
        from: deployer,
        args: ["Tether USD Token", "USDT", 8],
        log: true,
    })
}

module.exports.tags = ["BoringToken"]