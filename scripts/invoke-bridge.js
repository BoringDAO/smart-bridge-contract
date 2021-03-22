const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  // We get the contract to deploy
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.attach("0x77C06655A0d41d5e4cB60FE4f132c645Bc7bf8cf");
  await bridge.setFee(ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"), ethers.utils.parseEther("0.1"))

  // grant crosser role
  // await bridge.grantRole("CROSSER_ROLE", "");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
