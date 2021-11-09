const { expect } = require('chai');

describe("BridgeNFT Contract",function() {
    it("deployed", async function() {
        const [owner] = await ethers.getSigners()
        console.log("contract owner is:" + owner.address)
        const Token = await ethers.getContractFactory("BridgeNFT")
        const hardhatToken = await Token.deploy()
        
        // 1.set base uri
        let baseUri = "base"
        await hardhatToken.setBaseURI(baseUri)
        console.log("set base uri equals to " + baseUri)
        
        // 2.mint token
        await hardhatToken.safeMint(owner.address, "first token")
        console.log(owner.address + " mint success");

        // 3. get owner balance
        let ownerBalance  = await hardhatToken.balanceOf(owner.address)
        console.log(owner.address + " balance is:" + ownerBalance)
        // let baseUri = await hardhatToken.baseUri()
        // console.log(baseUri)
        // console.log(hardhatToken.get())
        // hardhatToken.safeMint(owner.address,"first token uri")
    
        // const ownerBalance = await hardhatToken.balanceOf(owner.address);
        // console.log("ownerBanlance:" + ownerBalance);
        // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
});



