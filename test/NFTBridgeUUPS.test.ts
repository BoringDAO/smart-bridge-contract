import hre from 'hardhat'
import assert from 'assert'

describe("BoringBridgeNFTUUPS Contract",function() {
    it("deployed", async function() {
        const [owner, user1, user2] = await ethers.getSigners()
        console.log(`contract owner is: ${owner.address}`)
        console.log(`contract user1 is: ${user1.address}\n`)

        // 0. deploy a NFT TOKEN
        console.log("----------Deploy NFT Token And Mint a NFT To Owner--------")
        const NFTToken = await ethers.getContractFactory("NFT")
        const nft = await NFTToken.deploy()
        console.log("BridgeNFT Token Address:" + nft.address)
        const nftId = 999
        const nftChainId = 0

        // 1 set NFT base uri 
        // const baseUri = "base"
        // await BridgeNFT.setBaseURI(baseUri)
        // console.log("set base uri equals to " + baseUri)

        // 2. deploy Bridge Contract
        console.log("-----------Deploy BoringBridgeNFT----------")
        const BridgeToken = await hre.ethers.getContractFactory('NFTBridgeUUPS')
        const BoringBridge = await hre.upgrades.deployProxy(BridgeToken, {kind:'uups'});

        console.log(`BoringBridgeNFT Contract Address: ${BoringBridge.address}\n`)

        //3. NFT Mint
        console.log("---------------NFT mint to owner---------")
        const nftUri = "http://first-nft-token.com"
        await nft.safeMint(owner.address, nftId)
        let ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}\n`)


        //4. CrossOut Transfer
        console.log("--------Add Support Token-----")
        const targetChainId = 97
        await BoringBridge.addSupportToken(nft.address, targetChainId)
        console.log(`add token ${nft.address} and chainID ${targetChainId}\n`)

        console.log("-----------approve-----------------------")
        await nft.approve(BoringBridge.address, nftId)

        console.log("--------set token Threshold-----\n")
        await BoringBridge.setThreshold(nft.address, 1)
        
        console.log("-----------Set is Current Chain-----------\n")
        await BoringBridge.setCurrentChainToken(nft.address)

        console.log("--------Cross Out: transfer-----")

        console.log("--------Cross Out: before-----")
        ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}\n`)
        let BoringBridgeBalance  = await nft.balanceOf(BoringBridge.address)
        console.log("BoringBridge nft balance:" + BoringBridgeBalance)

        await BoringBridge.crossOut(nft.address, targetChainId, owner.address, nftId)

        console.log("--------Cross Out: after-----")
        ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}`)
        BoringBridgeBalance  = await nft.balanceOf(BoringBridge.address)
        console.log(`BoringBridge nft balance:${BoringBridgeBalance}\n`)

        //5. Cross In Transfer
        console.log("--------Cross In: before-----")
        ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}\n`)
        BoringBridgeBalance  = await nft.balanceOf(BoringBridge.address)
        console.log("BoringBridge balance is:" + BoringBridgeBalance)

        const nftCrossInHash = "0x202109191606"
        await BoringBridge.crossIn({token:nft.address,chainId:nftChainId, tokenId:nftId}, nftUri, owner.address, owner.address, nftCrossInHash)

        console.log("--------Cross In: after-----")
        ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}`)
        BoringBridgeBalance  = await nft.balanceOf(BoringBridge.address)
        console.log(`BoringBridge nft balance is:${BoringBridgeBalance}\n`)


        // 6. Cross In:Mint
        console.log("----------Cross In : Mint--------")
        console.log("-----------remove is Current Chain(Simulation)-----------\n")
        await BoringBridge.removeCurrentChainToken(nft.address)

        console.log("--------Cross In: before-----")
        let ownerBridgeBalance  = await BoringBridge.balanceOf(owner.address)
        console.log(`owner bridge balance: ${ownerBridgeBalance}`)
        let contractBridgeBalance  = await BoringBridge.balanceOf(BoringBridge.address)
        console.log(`contractBridgeBalance bridge balance is:${contractBridgeBalance}`)

        const bridgeCrossInHash = "0x202109191641"
        await BoringBridge.crossIn({token:nft.address,chainId:nftChainId, tokenId:nftId}, nftUri, owner.address, owner.address, bridgeCrossInHash)

        console.log("--------Cross In: after-----")
        ownerBridgeBalance  = await BoringBridge.balanceOf(owner.address)
        console.log(`owner bridge balance: ${ownerBridgeBalance}`)
        contractBridgeBalance  = await BoringBridge.balanceOf(BoringBridge.address)
        console.log(`contractBridgeBalance bridge balance is:${contractBridgeBalance}\n`)

        //7. Cross Out: Burn
        console.log("--------Cross Out: before-----")
        ownerBridgeBalance  = await BoringBridge.balanceOf(owner.address)
        console.log(`owner bridge balance: ${ownerNFTBalance}`)
        contractBridgeBalance  = await BoringBridge.balanceOf(BoringBridge.address)
        console.log(`contractBridgeBalance bridge balance is:${contractBridgeBalance}\n`)

        const BridgeNftId = 0
        console.log("--------Add Support Token-----")
        await BoringBridge.addSupportToken(BoringBridge.address, targetChainId)
        console.log(`add token ${BoringBridge.address} and chainID ${targetChainId}\n`)

        console.log("-----------approve-----------------------")
        await BoringBridge.approve(BoringBridge.address, BridgeNftId)

        await BoringBridge.crossOut(BoringBridge.address, targetChainId, owner.address, BridgeNftId)

        console.log("--------Cross Out: after-----")
        ownerBridgeBalance  = await BoringBridge.balanceOf(owner.address)
        console.log(`owner Bridge balance: ${ownerBridgeBalance}`)
        contractBridgeBalance  = await BoringBridge.balanceOf(BoringBridge.address)
        console.log(`BoringBridge Bridge balance:${contractBridgeBalance}\n`)
    });
})
