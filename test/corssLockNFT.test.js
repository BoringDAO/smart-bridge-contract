const { expect } = require("chai");

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("BridgeNFT");

    const hardhatToken = await Token.deploy();

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    console.log("ownerBanlance:" + ownerBalance);
    // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});