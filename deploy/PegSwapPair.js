const { network } = require("hardhat")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments

    const { deployer } = await getNamedAccounts()

    let name;
    let token0;
    let token1;
    if (network.name === "bsc_test") {
        name = "USDT-PSP-ETH"
        token0 = "0x6D2F93F83ECCA6d6Dc0A72426a55A5CE83819a35"
        token1 = "0xFB36234069a9b06f8931E77b4ba91C620ba05267"
    } else if (network.name === "kovan") {
        name = "USDT-PSP-BSC"
        token0 = "0x9A204A98fa6A8ac990d7FB3D98245a997622e122"
        token1 = "0x9D050Da7272F428b3cA14E892e5e87E5CA4D6DcB"
    }

    await deploy(name, {
        contract: "PegSwapPair",
        from: deployer,
        args: ["USDT PegSwapPair", name],
        log: true,
    })

    await execute(name, {
        contract: "PegSwapPair",
        from: deployer, log: true
    }, "initialize", token0, token1)
}

module.exports.tags = ["PegSwapPair"]