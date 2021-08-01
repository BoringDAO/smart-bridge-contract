const { ethers, network } = require("hardhat")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, execute } = deployments

    const { deployer } = await getNamedAccounts()
    let chainid = (await ethers.provider.getNetwork()).chainId;
    console.log(`${deployer} in ${network.name} of chainid ${chainid}`)


    let underToken = "0x938850c1957eb81932974258d2303877fe712c4e"
    switch(network.name) {
        case "okex":
            // fin
            underToken = "0x8D3573f24c0aa3819A2f5b02b2985dD82B487715"
            break;
        case "kovan":
            underToken = ""
            break;
    }

    await deploy("WrapFIN", {
        contract: "WrapToken",
        from: deployer,
        args: [deployer, deployer, underToken],
        log: true,
    })

    await execute("WrapFIN", {
        from: deployer,
        log: true
    }, "setDispatcher", "0x21314f0f9d79150622179d6d10a68b90f6bcd9c6"
    )

}

module.exports.tags = ["WrapToken"]