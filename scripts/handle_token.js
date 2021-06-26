const { ethers, upgrades } = require("hardhat");
const {crossLockAddr} = require("../contracts.json")

let tokenAddr = ""
let bridgeAddr = ""
let token

async function init() {
    token = await ethers.getContractAt("Token", tokenAddr)
}

async function grant() {
    await init()
    token.
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