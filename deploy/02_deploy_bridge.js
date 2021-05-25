const { network, ethers } = require("hardhat");

module.exports = async ({
    deployments,
    run
}) => {
    const {
        deploy,
        get,
        execute,
        read
    } = deployments;
    const {
        deployer,
        crosser1,
        crosser2
    } = await ethers.getNamedSigners();
    console.log(`deployer ${deployer.address} `)
    let token0 = ""
    let token1 = ""
    // let feeto0 = crosser1
    let chainId
    // let feeto1 = crosser2.address
    switch (network.name) {
        case "bsc_test":
            token0 = "0x713e821ef3c51283f2e9925253b075469ac486ed";
            token1 = "0xbfC0b0f561497e2D01C3eb4E3fBEA19f878048Be";
            break
        case "okex_test":
            token0 = "0xC877Ec4f22317A30BA04A17796d4497490A76e22"
            token1 = (await get("TokenBor")).address
            break
        case "okex":
            token0 = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
            token1 = (await get("TokenBoring")).address
            chainId = 66
            break
        case "bsc":
            token0 = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
            // token0 = "0x78e1d16ba607c61bccfe23ba3b3369ad44df960f"
            // token1 = "0xfea9871bf99f8d10d908a2266fc0c9710cdd2ee3"
            token1 = "0xffEecbf8D7267757c2dc3d13D730E97E15BfdF7F"
            chainId = 56
            break
    }
    await deploy('Bridge', {
        from: deployer.address,
        log: true,
        args: [chainId]
    })
    console.log(`${token0}, ${token1}`)
    await execute("Bridge", {from: deployer.address, log: true}, "addSupportToken", token0, token1)
    await execute("Bridge", { from: deployer.address, log: true }, "setFee", token0, ethers.utils.parseEther("200"), ethers.utils.parseEther("0.002"), ethers.utils.parseEther("400"), ethers.utils.parseEther("0.002"))
    await execute("Bridge", {from: deployer.address, log: true}, "setThreshold", token1, 1);
    await execute("Bridge", {from: deployer.address, log: true}, "addFeeTo", token0, "0x09587012B3670D75a90930be9282d98063E402a2")
    let key = await read("Bridge", "getRoleKey", token0, token1)
    await execute("Bridge", {from: deployer.address, log: true}, "grantRole", key, "0xbc41ef18dfae72b665694b034f608e6dfe170149")
}

module.exports.tags = ["02"]