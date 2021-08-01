const { formatEther } = require("ethers/lib/utils");
const { ethers, upgrades } = require("hardhat");
const {avax_bridge, okex_bridge, harmony_bridge} = require("../contracts.json")

// let bridgeAddr = harmony_bridge
// const fromToken = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA"
// const toToken = "0x017Ff87AB312301aDE54f7cf9Cc5AEA28C9De024"
// const lockFeeAmount = ethers.utils.parseEther("50")
// const lockFeeRatio = ethers.utils.parseEther("0.005")
// const unlockFeeAmount = ethers.utils.parseEther("500")
// const unlockFeeRatio = ethers.utils.parseEther("0.005")
// const threshold = 1


// // fin
let bridgeAddr = "0xD644BBa8B4d8b8188BEa2325D12F187ca7511dC1"
const fromToken = "0x054f76beed60ab6dbeb23502178c52d6c5debe40"
const toToken = "0x2B21237BA30deF78EC551a10C99d656F90Eb10fC"
const lockFeeAmount = ethers.utils.parseEther("5")
const lockFeeRatio = ethers.utils.parseEther("0.005")
const unlockFeeAmount = ethers.utils.parseEther("50")
const unlockFeeRatio = ethers.utils.parseEther("0.005")
const threshold = 1

// obtc
// let bridgeAddr = "0x45745F2Ec18D8C1424486E2B06975973C2db87D7"
// const fromToken = "0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68"
// const toToken = "0x0314fc7180dD2A4370A4039ccf11f2C1a4a9C33B"
// const lockFeeAmount = ethers.utils.parseEther("0.00025")
// const lockFeeRatio = ethers.utils.parseEther("0.005")
// const unlockFeeAmount = ethers.utils.parseEther("0.00025")
// const unlockFeeRatio = ethers.utils.parseEther("0.005")
// const threshold = 1


// oltc
// let bridgeAddr = "0x45745F2Ec18D8C1424486E2B06975973C2db87D7"
// const fromToken = "0x07C44B5Ac257C2255AA0933112c3b75A6BFf3Cb1"
// const toToken = "0xd4694898DDf455bA703446Bba52034d1212B24D9"
// const lockFeeAmount = ethers.utils.parseEther("0.06")
// const lockFeeRatio = ethers.utils.parseEther("0.005")
// const unlockFeeAmount = ethers.utils.parseEther("0.08")
// const unlockFeeRatio = ethers.utils.parseEther("0.005")
// const threshold = 1



const crossers = ["0xbC41ef18DfaE72b665694B034f608E6Dfe170149"]
let feeTo = ["0x09587012B3670D75a90930be9282d98063E402a2"]

let bridge;

async function init() {
    bridge = await ethers.getContractAt("Bridge", bridgeAddr)
}

async function addToken() {
    await init()

    // const result = await (await bridge.addSupportToken(fromToken, toToken)).wait()

    // for (const f of feeTo) {
    //     await (await bridge.addFeeTo(fromToken, f)).wait()
    // }

    await (await bridge.setFee(fromToken, lockFeeAmount, lockFeeRatio, unlockFeeAmount, unlockFeeRatio)).wait()

    // await (await bridge.setThreshold(toToken, threshold)).wait()

    // const roleKey = await bridge.getRoleKey(fromToken, toToken)
    // for ( const c of crossers) {
    //     await (await bridge.grantRole(roleKey, c)).wait()
    // }
}

async function deployBridge() {
    let chainId = (await ethers.provider.getNetwork()).chainId
    console.log(`chianId ${chainId}`)
    const Bridge = await ethers.getContractFactory("Bridge")
    bridge = await upgrades.deployProxy(Bridge, [chainId], {kind: "uups"})
    await bridge.deployed()
    console.log(`Bridge deployed at ${bridge.address}`)
}

async function checkParams() {
    const bridge = await ethers.getContractAt("Bridge", bridgeAddr)
    let feeAmount = await bridge.lockFeeAmount(fromToken)
    console.log(`fee Amount: ${formatEther(feeAmount)}`)
}

async function main() {
    // await deployBridge()
    // let feeAmount = await addToken()
    await checkParams()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })