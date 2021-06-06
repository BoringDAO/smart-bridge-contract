const { ethers } = require("hardhat");
const {avax_oltc, bridgeAddr, bsc_boring} = require("../contracts.json")

const tokenName = "BoringDAO LTC"
const symbol = "oLTC"
const token_addr = bsc_boring
let admin

async function init() {
    const [deployer,] = await ethers.getSigners()
    let networkName = (await ethers.provider.getNetwork()).name
    admin = deployer.address
    console.log(`${deployer.address} In ${networkName}`)
}

async function grantRole() {
    console.log(`grant role to bridge ${bridgeAddr}`)
    const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
    const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
    const token = await ethers.getContractAt("Token", token_addr)
    await token.grantRole(minter, bridgeAddr)
    await token.grantRole(burner, bridgeAddr)
}

async function deploy() {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(tokenName, symbol, admin);
    await token.deployed();

    console.log("token deployed to:", token.address);
}

async function main() {
    await init()
    await grantRole()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
