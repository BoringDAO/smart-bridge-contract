const { ethers, upgrades } = require("hardhat");
// const {crossLockAddr} = require("../contracts.json")

// const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"

// const fromToken = "0x054f76beed60ab6dbeb23502178c52d6c5debe40"
// const toToken = "0x8D3573f24c0aa3819A2f5b02b2985dD82B487715"
// const chainId = 1666600000;
// const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]


// definer fin
// const fromToken = "0x054f76beed60ab6dbeb23502178c52d6c5debe40"
// const toToken = "0x2B21237BA30deF78EC551a10C99d656F90Eb10fC"
// const chainId = 66;
// const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]


// obtc 
// const fromToken = "0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68"
// const toToken = "0x0314fc7180dD2A4370A4039ccf11f2C1a4a9C33B"
// const chainId = 56;
// const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]


// oltc 
const fromToken = "0x07C44B5Ac257C2255AA0933112c3b75A6BFf3Cb1"
const toToken = "0xd4694898DDf455bA703446Bba52034d1212B24D9"
const chainId = 56;
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
    // await init()
    // await deploy()
    await addToken()
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