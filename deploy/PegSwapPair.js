
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments

    const { deployer } = await getNamedAccounts()

    const name = "USDT-PSP-ETH"

    await deploy(name, {
        contract: "PegSwapPair",
        from: deployer,
        args: ["USDT PegSwapPair", name],
        log: true,
    })

    const token0 = "0x6D2F93F83ECCA6d6Dc0A72426a55A5CE83819a35"
    const token1 = "0xFB36234069a9b06f8931E77b4ba91C620ba05267"
    await execute(name, {
        contract: "PegSwapPair",
        from: deployer, log: true
    }, "initialize", token0, token1)
}

module.exports.tags = ["PegSwapPair"]