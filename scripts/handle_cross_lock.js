const { ethers, upgrades } = require("hardhat");
// const {crossLockAddr} = require("../contracts.json")

// const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
const fromToken = "0x054f76beed60ab6dbeb23502178c52d6c5debe40"
const toToken = "0x8D3573f24c0aa3819A2f5b02b2985dD82B487715"
const chainId = 1666600000;
const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]

let crossLock;

async function init() {
    let crossLockAddr = process.env.crossLockAddrMainnet
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

async function setThreshold() {
    let tx = await crossLock.setThreshold(fromToken, 1);
    console.log(`setThreshold Pending ${tx.hash}`)
    await tx.wait()
}

async function main() {
    await init()
    // await deploy()
    // await addToken()
    await setThreshold()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })