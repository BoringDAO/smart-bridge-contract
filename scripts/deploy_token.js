const { ethers } = require("hardhat");
const {avax_oltc, avax_bridge, bsc_boring, avax_boring, okex_bridge, okex_boring, harmony_boring, harmony_bridge} = require("../contracts.json")

const tokenName = "BoringDAO"
const symbol = "BORING"
const token_addr = harmony_boring
let bridgeAddr = harmony_bridge
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
    await (await token.grantRole(minter, bridgeAddr)).wait()
    await (await token.grantRole(burner, bridgeAddr)).wait()
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
    // await deploy()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
