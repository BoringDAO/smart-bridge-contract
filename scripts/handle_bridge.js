const { ethers, upgrades } = require("hardhat");
const {bridgeAddr} = require("../contracts.json")

const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
const toToken = "0xffEecbf8D7267757c2dc3d13D730E97E15BfdF7F"
const lockFeeAmount = ethers.utils.parseEther("50")
const lockFeeRatio = ethers.utils.parseEther("0.005")
const unlockFeeAmount = ethers.utils.parseEther("500")
const unlockFeeRatio = ethers.utils.parseEther("0.005")
const threshold = 1

const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]
let feeTo = ["0x09587012B3670D75a90930be9282d98063E402a2"]

let bridge;

async function init() {
    bridge = await ethers.getContractAt("Bridge", bridgeAddr)
}

async function addToken() {
    await init()

    const result = await bridge.addSupportToken(fromToken, toToken)

    for (const f of feeTo) {
        await bridge.addFeeTo(fromToken, f)
    }

    await bridge.setFee(fromToken, lockFeeAmount, lockFeeRatio, unlockFeeAmount, unlockFeeRatio)

    await bridge.setThreshold(toToken, threshold)

    const roleKey = await bridge.getRoleKey(fromToken, toToken)
    for ( const c of crossers) {
        await bridge.grantRole(roleKey, c)
    }
}

async function deployBridge() {
    let chainId = (await ethers.provider.getNetwork()).chainId
    console.log(`chianId ${chainId}`)
    const Bridge = await ethers.getContractFactory("Bridge")
    const bridge = await upgrades.deployProxy(Bridge, [chainId], {kind: "uups"})
    await bridge.deployed()
    console.log(`Bridge deployed at ${bridge.address}`)
}

async function main() {
    // await deployBridge()
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