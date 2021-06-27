
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("USDT-PegSwapPair", {
        contract: "PegSwapPair",
        from: deployer,
        args: ["USDT PegSwapPair", "USDT-PSP"],
        log: true,
    })

    const token0 = "0x58976823450D3AeF1D63E883D106FAca41973321"
    const token1 = "0x1867a7B29342F2157DB8948C9F2e59dB18E6481E"
    await execute("USDT-PegSwapPair", {
        contract: "PegSwapPair",
        from: deployer, log: true
    }, "initialize", token0, token1)
}

module.exports.tags = ["PegSwapPair"]