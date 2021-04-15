
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("PegProxy", {
        from: deployer,
        args: [2],
        log: true,
    })

    await execute("PegProxy", {
        from: deployer.address, log: true
    }, "initialize", token0, token1)

}

module.exports.tags = ["PegProxy"]