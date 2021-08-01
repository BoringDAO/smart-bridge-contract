const { ethers, upgrades } = require("hardhat");
const {crossLockAddr} = require("../contracts.json")

// fin okex
// let tokenAddr = "0x2B21237BA30deF78EC551a10C99d656F90Eb10fC"
// let bridgeAddr = "0xD644BBa8B4d8b8188BEa2325D12F187ca7511dC1"


// obtc bsc
// let tokenAddr = "0x0314fc7180dD2A4370A4039ccf11f2C1a4a9C33B"
// let bridgeAddr = "0x45745F2Ec18D8C1424486E2B06975973C2db87D7"


// obtc bsc
let tokenAddr = "0xd4694898DDf455bA703446Bba52034d1212B24D9"
let bridgeAddr = "0x45745F2Ec18D8C1424486E2B06975973C2db87D7"

let token

async function init() {
    token = await ethers.getContractAt("Token", tokenAddr)
}

async function grantRole() {
    console.log(`grant role to bridge ${bridgeAddr}`)
    const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
    const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
    // const token = await ethers.getContractAt("Token", token_addr)
    await (await token.grantRole(minter, bridgeAddr)).wait()
    await (await token.grantRole(burner, bridgeAddr)).wait()
}

async function main() {
    // await deploy()
    await init()
    await grantRole()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })