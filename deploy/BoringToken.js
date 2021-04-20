
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("BoringToken", {
        from: deployer,
        args: ["Boring DAI Token", "BoringDAI"],
        log: true,
    })
}

module.exports.tags = ["BoringToken"]