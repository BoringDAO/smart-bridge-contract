
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    console.log(`${deployer} in ${network.name}`)

    const underToken = "0x938850c1957eb81932974258d2303877fe712c4e"

    await deploy("WrapFIN", {
        contract: "WrapToken",
        from: deployer,
        args: [deployer, deployer, underToken],
        log: true,
    })
}

module.exports.tags = ["WrapToken"]