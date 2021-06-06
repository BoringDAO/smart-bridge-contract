const { ethers, upgrades } = require("hardhat");
const {crossLockAddr} = require("../contracts.json")

const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
const toToken = "0xffEecbf8D7267757c2dc3d13D730E97E15BfdF7F"
const chainId = 56;
const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]

let crossLock;

async function init() {
    crossLock = await ethers.getContractAt("CrossLock", crossLockAddr)
}

async function deploy() {
    const CrossLock = await ethers.getContractFactory("CrossLock")
    const crossLock = await upgrades.deployProxy(CrossLock, {kind: "uups"})
    await crossLock.deployed()
    console.log(`crossLock deployed at ${crossLock.address}`)
}

async function addToken() {
    await init()
    const result = await crossLock.addSupportToken(fromToken, toToken, chainId)
    const roleKey = await crossLock.getRoleKey(fromToken, toToken, chainId)
    for ( const c of crossers) {
        await crossLock.grantRole(roleKey, c)
    }
}

async function main() {
    // await deploy()
    await addToken()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })