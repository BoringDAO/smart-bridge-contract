const { expect } = require('chai');

describe("BoringBridgeNFT Contract",function() {
    it("deployed", async function() {

        const [owner, user1, user2] = await ethers.getSigners()
        console.log(`contract owner is: ${owner.address}`)
        console.log(`contract user1 is: ${user1.address}\n`)

        // 0. deploy a NFT TOKEN
        console.log("----------Deploy NFT Token And Mint a NFT To Owner--------")
        const NFTToken = await ethers.getContractFactory("BridgeNFT")
        const NFT = await NFTToken.deploy()
        console.log("BridgeNFT Token Address:" + NFT.address)
        const token0 = NFT.address
        const token0Id = 999

        // 1 set NFT base uri 
        // const baseUri = "base"
        // await BridgeNFT.setBaseURI(baseUri)
        // console.log("set base uri equals to " + baseUri)

        // 2. deploy Bridge Contract
        console.log("-----------Deploy BoringBridgeNFT----------")
        const BridgeToken = await ethers.getContractFactory("BoringBridgeNFT")
        const BoringBridge = await BridgeToken.deploy()
        console.log(`BoringBridgeNFT Contract Address: ${BoringBridge.address}\n`)


        await NFT.safeMint(BoringBridge.address, token0Id, "first token")
        let BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)

        // 3.Mint
        // console.log("-----------Mint----------")
        // const tokenId = 1
        // const tokenURI_ = "http://1.BoringBridgeNFT.com"
        // await BoringBridge.safeMint(owner.address, tokenId, tokenURI_)
        // let ownerBalance  = await BoringBridge.balanceOf(owner.address)
        // console.log(`owner's balance is:${ownerBalance}`)

        // const tokenID_uri = await BoringBridge.tokenURI(tokenId)
        // console.log(`tokenId:${tokenId} tokenURI:${tokenID_uri}\n`)

        // 4.Tranfer
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
        const chainID = 97
        console.log("--------Add Support Token-----")
        
        console.log(`add token ${BoringBridge.address} and chainID ${chainID}`)
        await BoringBridge.addSupportToken(BoringBridge.address, 97)
        console.log('\n')

        // 6. CrossOut
        // console.log("--------Cross Out-----")
        // console.log("-----------Burn-------")
        // await BoringBridge.CrossOut(BoringBridge.address, 97, user1.address, tokenId)
        // ownerBalance  = await BoringBridge.balanceOf(owner.address)
        // console.log("owner's balance is:" + ownerBalance)
        // console.log('\n')

        // 7. set token Threshold
        console.log("--------set token Threshold-----\n")
        await BoringBridge.setThreshold(token0, 1)

        // 8. CrossIn
        // console.log("--------Cross In-----")
        // console.log("-----------Cross In:Mint-------")
        // await BoringBridge.CrossIn(BoringBridge.address, owner.address, user1.address, tokenId, tokenID_uri,'0x01')
        // user1Balance  = await BoringBridge.balanceOf(user1.address)
        // console.log(`user1's balance is:${user1Balance}\n`)

        // 8.2 Cross In:transfer
        console.log("-----------Cross In:transfer-----------")

        // 8.2.1 
        console.log("-----------Set is Current Chain-----------")
        BoringBridge.setIsCurrentChain(token0)
        
        // 8.2.2
        console.log("-----------approve-----------------------")
        // await NFT.approve(BoringBridge.address, token0Id)

        // 8.2.2 
        console.log("-----------cross in before-----------")
        let user1NFTBalance  = await NFT.balanceOf(user1.address)
        BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        console.log(`user1 nft balance: ${user1NFTBalance}`)
        console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)
        await BoringBridge.crossIn(token0, owner.address, user1.address, token0Id, '0x01')
        console.log("-----------cross in after-----------")
        user1NFTBalance  = await NFT.balanceOf(user1.address)
        BoringBridgeNFTBalance  = await NFT.balanceOf(BoringBridge.address)
        console.log(`user1 nft balance: ${user1NFTBalance}`)
        console.log(`BoringBridge nft balance: ${BoringBridgeNFTBalance}\n`)


        // function CrossOut(
        //     address token0, 
        //     uint256 chainID, 
        //     address to, 
        //     uint256 tokenId)

        // 7.add IsCurrent
        

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



