const { ethers, upgrades } = require("hardhat");
const {avax_bridge, okex_bridge, harmony_bridge} = require("../contracts.json")

let bridgeAddr = harmony_bridge
const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
const toToken = "0x017Ff87AB312301aDE54f7cf9Cc5AEA28C9De024"
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

    const result = await (await bridge.addSupportToken(fromToken, toToken)).wait()

    for (const f of feeTo) {
        await (await bridge.addFeeTo(fromToken, f)).wait()
    }

    await (await bridge.setFee(fromToken, lockFeeAmount, lockFeeRatio, unlockFeeAmount, unlockFeeRatio)).wait()

    await (await bridge.setThreshold(toToken, threshold)).wait()

    const roleKey = await bridge.getRoleKey(fromToken, toToken)
    for ( const c of crossers) {
        await (await bridge.grantRole(roleKey, c)).wait()
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