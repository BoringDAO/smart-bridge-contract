const { ethers, upgrades } = require("hardhat");
const {crossLockAddr} = require("../contracts.json")

const nftAddr = "0x1f8aee3f8317dcb1da45df11173391fdf841033a"
const BridgeAddr = "0x5319A81CE4E53adDA007A2283DFa482A9211caeB"

const user = "0xd6Aa9ba64846223d6cD0C39526a4305A32D27482"

let token
let bridge
const tokenId = 1
const chainId = 97

async function init() {
    token = await ethers.getContractAt("BridgeNFT", nftAddr)
    let bridgeTokenBalance = await token.ownerOf(1)
    console.log("owern:" + bridgeTokenBalance)


    bridge = await ethers.getContractAt("BoringBridgeNFT", BridgeAddr)

    // console.log(`---------settings-------------`)
    // console.log("------approve-------")
    // console.log(BridgeAddr)
    // console.log(tokenId)
    // await token.approve(BridgeAddr, tokenId)
    // console.log("------current chain-------\n")
    // await bridge.setIsCurrentChain(nftAddr)
    // console.log("-------set supporttoken------\n")
    // await bridge.addSupportToken(BridgeAddr, chainId)
    // console.log("--------set token Threshold-----\n")
    // await bridge.setThreshold(nftAddr, 1)
    // console.log(`---------settings-------------`)


    // let userTokenBalance = await token.balanceOf(user)
    // console.log(`userTokenBalance:${userTokenBalance}`)
    // let bridgeTokenBalance = await token.balanceOf(BridgeAddr)
    // console.log(`bridgeTokenBalance:${bridgeTokenBalance}\n`)

    // bridge.crossOut(nftAddr, user, chainId, tokenId)

    // userTokenBalance = await token.balanceOf(user)
    // console.log(`userTokenBalance:${userTokenBalance}`)
    // bridgeTokenBalance = await token.balanceOf(BridgeAddr)
    // console.log(`bridgeTokenBalance:${bridgeTokenBalance}\n`)
}

// async function setting() {

// }

// async function interact() {

// }


async function grantRole() {
    // console.log(`grant role to bridge ${bridgeAddr}`)
    const minter = ethers.utils.formatBytes32String("MINTER_ROLE")
    const burner = ethers.utils.formatBytes32String("BURNER_ROLE")
    // const token = await ethers.getContractAt("Token", token_addr)
    // await (await token.grantRole(minter, bridgeAddr)).wait()
    // await (await token.grantRole(burner, bridgeAddr)).wait()
}

async function main() {
    // await deploy()
    await init()
    // await grantRole()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)
    })