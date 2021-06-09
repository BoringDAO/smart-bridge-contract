
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log(`${deployer} in ${network.name}`)

    await deploy("PegProxy", {
        from: deployer,
        log: true,
    })
}

module.exports.tags = ["PegProxy"]