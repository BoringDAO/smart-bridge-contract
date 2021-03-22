const { ethers} = require("hardhat");


async function main() {
    const [owner, user1, user2] = await ethers.getSigners()
    const Bridge = await ethers.getContractFactory("Bridge")
    const bridge = await Bridge.attach("0x77C06655A0d41d5e4cB60FE4f132c645Bc7bf8cf")
    const Itoken = await ethers.getContractFactory("TestIToken")
    const t = Itoken.attach("0xD6Ff436ddD8E87Aa368715F1E1C873fbECccfD2f")
    t.connect(user1)
    bridge.connect(user1)
    await t.approve(bridge.address, ethers.utils.parseEther("5"))
    await bridge.crossBurn(user2.address, ethers.utils.parseEther("2"))


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });