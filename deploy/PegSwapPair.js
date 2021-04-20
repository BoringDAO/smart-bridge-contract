
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments

    const { deployer } = await getNamedAccounts()

    await deploy("PegSwapPair", {
        from: deployer,
        args: ["DAI PegSwapPair", "DAI-PSP"],
        log: true,
    })

    const token0 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    const token1 = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    await execute("PegSwapPair", {
        from: deployer.address, log: true
    }, "initialize", token0, token1)

}

module.exports.tags = ["TestERC20"]