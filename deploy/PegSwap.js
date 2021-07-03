
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log(`${deployer} in ${network.name}`)

    await deploy("PegSwap", {
        contract: "PegSwap",
        from: deployer,
        log: true,
    })
}

module.exports.tags = ["PegSwap"]