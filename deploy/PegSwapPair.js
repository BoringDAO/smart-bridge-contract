
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("USDT-PegSwapPair", {
        contract: "PegSwapPair",
        from: deployer,
        args: ["USDT PegSwapPair", "USDT-PSP"],
        log: true,
    })

    const token0 = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
    const token1 = "0x6a69A5D445F6FE876ebcb9BE72A3fe7Cda84a65E"
    await execute("USDT-PegSwapPair", {
        contract: "PegSwapPair",
        from: deployer, log: true
    }, "initialize", token0, token1)
}

module.exports.tags = ["PegSwapPair"]