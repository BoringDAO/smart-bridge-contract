
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("PegSwap", {
        from: deployer,
        log: true,
    })

    await execute("PegSwapPair", {
        from: deployer.address, log: true
    }, "initialize", token0, token1)


}

module.exports.tags = ["TestERC20"]
module.exports.dependencies = ["PegProxy"]