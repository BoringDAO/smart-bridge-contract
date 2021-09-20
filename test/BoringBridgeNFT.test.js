const { expect } = require('chai');

describe("BoringBridgeNFT Contract",function() {
    it("deployed", async function() {

        const [owner, user1, user2] = await ethers.getSigners()
        console.log(`contract owner is: ${owner.address}`)
        console.log(`contract user1 is: ${user1.address}\n`)

        // 0. deploy a NFT TOKEN
        console.log("----------Deploy NFT Token And Mint a NFT To Owner--------")
        const NFTToken = await ethers.getContractFactory("BridgeNFT")
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
        const BridgeToken = await ethers.getContractFactory("BoringBridgeNFT")
        const BoringBridge = await BridgeToken.deploy()
        console.log(`BoringBridgeNFT Contract Address: ${BoringBridge.address}\n`)

        //3. NFT Mint
        console.log("---------------NFT mint to owner")
        const nftUri = "http://first-nft-token.com"
        await nft.safeMint(owner.address, nftId, nftUri)
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
        await BoringBridge.setIsCurrentChain(nft.address)

        console.log("--------Cross Out: transfer-----")

        console.log("--------Cross Out: before-----")
        ownerNFTBalance  = await nft.balanceOf(owner.address)
        console.log(`owner nft balance: ${ownerNFTBalance}\n`)
        BoringBridgeBalance  = await nft.balanceOf(BoringBridge.address)
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
        await BoringBridge.removeIsCurrentChain(nft.address)

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



        //3.Mint
        // console.log("-----------Mint----------")
        // const tokenId = 1
        // const tokenURI_ = "http://1.BoringBridgeNFT.com"
        // await BoringBridge.safeMint(owner.address, tokenId, tokenURI_)
        // let ownerBalance  = await BoringBridge.balanceOf(owner.address)
        // console.log(`owner's balance is:${ownerBalance}`)

        // const tokenID_uri = await BoringBridge.tokenURI(tokenId)
        // console.log(`tokenId:${tokenId} tokenURI:${tokenID_uri}\n`)

        //4.Tranfer
        // console.log("-----------Transfer------------")
        // console.log("--before transfer--")
        // let user1Balance  = await BoringBridge.balanceOf(user1.address)
        // console.log(`owner's balance is:${ownerBalance}`)
        // console.log(`user1's balance is:${user1Balance}\n`)

        // await BoringBridge.transferFrom(owner.address, user1.address, tokenId)
        // console.log("--after transfer--")
        // ownerBalance  = await BoringBridge.balanceOf(owner.address)
        // user1Balance  = await BoringBridge.balanceOf(user1.address)
        // console.log("owner's balance is:" + ownerBalance)
        // console.log("user1's balance is:" + user1Balance)

        
        // 5. add Support Token
        // const chainID = 97
        // console.log("--------Add Support Token-----")
        
        // console.log(`add token ${BoringBridge.address} and chainID ${chainID}`)
        // await BoringBridge.addSupportToken(BoringBridge.address, chainID)
        // console.log('\n')

        // 6. CrossOut
        // console.log("--------Cross Out-----")
        // console.log("-----------Burn-------")
        // await BoringBridge.CrossOut(BoringBridge.address, 97, user1.address, tokenId)
        // ownerBalance  = await BoringBridge.balanceOf(owner.address)
        // console.log("owner's balance is:" + ownerBalance)
        // console.log('\n')

        // 7. set token Threshold
        // console.log("--------set token Threshold-----\n")
        // await BoringBridge.setThreshold(token0, 1)

        // 8. CrossIn
        // console.log("--------Cross In-----")
        // console.log("-----------Cross In:Mint-------")
        // await BoringBridge.CrossIn(BoringBridge.address, owner.address, user1.address, token0Id, tokenID_uri,'0x01')
        // user1Balance  = await BoringBridge.balanceOf(user1.address)
        // console.log(`user1's balance is:${user1Balance}\n`)

        // 8.2 Cross In:transfer
        // console.log("-----------Cross In:transfer-----------")

        // // 8.2.1 
        // console.log("-----------Set is Current Chain-----------")
        // await BoringBridge.setIsCurrentChain(token0)
        
        // // 8.2.2
        // console.log("-----------approve-----------------------")
        // await NFT.approve(BoringBridge.address, token0Id)

        // // 8.2.2 
        // console.log("-----------cross in before-----------")
        // let user1NFTBalance  = await NFT.balanceOf(user1.address)
        // BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)

        // let chainId0 = 0
        // await BoringBridge.crossIn({token:token0,chainId:chainId0,tokenId:token0Id}, token0Uri,owner.address, user1.address, '0x01')
        
        // console.log("-----------cross in after-----------")
        // user1NFTBalance  = await NFT.balanceOf(user1.address)
        // BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)


        // 9 cross out
        // 9.1 cross transfer
        // console.log("---------------cross out: transfer------------")
        // console.log("-----------cross out before-----------")
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)


        // await BoringBridge.crossOut(token0, chainId0, user1.address, token0Id)
        // console.log("-----------cross out after-----------")
        // user1NFTBalance  = await NFT.balanceOf(user1.address)
        // BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)
        

        // console.log("-----------Cross In:Mint-----------")

        // console.log("-----------remove token0 Current Chain-----------")
        // await BoringBridge.removeIsCurrentChain(token0)
        
        // // 8.2.2
        // console.log("-----------approve-----------------------")
        // await NFT.approve(BoringBridge.address, token0Id)

        // 8.2.2 
        // console.log("-----------cross in before-----------")
        // let user1NFTBalance  = await NFT.balanceOf(user1.address)
        // BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)

        // let chainId0 = 0
        // await BoringBridge.crossIn({token:token0,chainId:chainId0,tokenId:token0Id}, token0Uri,owner.address, user1.address, '0x01')
        
        // console.log("-----------cross in after-----------")
        // user1NFTBalance  = await NFT.balanceOf(user1.address)
        // BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        // console.log(`user1 nft balance: ${user1NFTBalance}`)
        // console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)

        

        // 1.set base uri
        // let baseUri = "https://"
        // await hardhatToken.setBaseURI(baseUri)
        // console.log("set base uri equals to " + baseUri)
        
        // 2.mint token
        // let user = 
        // safeMint(address to, uint256 tokenId, string memory tokenURI_)
        // await hardhatToken.safeMint(owner.address, "first token")
        // console.log(owner.address + " mint success");

        // 3. get owner balance
        // let ownerBalance  = await hardhatToken.balanceOf(owner.address)
        // console.log(owner.address + " balance is:" + ownerBalance)
        // let baseUri = await hardhatToken.baseUri()
        // console.log(baseUri)
        // console.log(hardhatToken.get())
        // hardhatToken.safeMint(owner.address,"first token uri")
    
        // const ownerBalance = await hardhatToken.balanceOf(owner.address);
        // console.log("ownerBanlance:" + ownerBalance);
        // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
});



