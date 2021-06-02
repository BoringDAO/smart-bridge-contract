const { upgrades } = require("hardhat");

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);
  console.log(`${hre.network.name}(${user1.address})`);

  // We get the contract to deploy
  const chainID = 1666700000
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await upgrades.deployProxy(Bridge, [chainID], { kind: "uups" })
  const crosser = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
  const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee";
  const token1 = "0x26Ec036Be42907eA15a273833816539B26d2BE53";
  const feeTo = "0x0b2Ee5331f04cB8FCcb76CDd134Ec878A61d4429"

  //   const bridge = await Bridge.deploy(crossers, token0, token1, feeTo);
  await bridge.deployed();

  console.log("Bridge deployed to:", bridge.address);
  const roleKey = await bridge.getRoleKey(token0, token1)
  console.log(`role key ${roleKey}`)
  console.log(`=====addSupportToken=====`)
  await (await bridge.addSupportToken(token0, token1)).wait()
  console.log(`=====grantRole=====`)
  await (await bridge.grantRole(roleKey, crosser)).wait()
  console.log(`=====setThreshold=====`)
  await (await bridge.setThreshold(token1, 1)).wait()
  console.log(`=====addFeeTo=====`)
  await (await bridge.addFeeTo(token0, feeTo)).wait()
  console.log(`=====setFee=====`)
  await (await bridge.setFee(token0, ethers.utils.parseEther("200"),
    ethers.utils.parseEther("0.002"),
    ethers.utils.parseEther("400"),
    ethers.utils.parseEther("0.002"))).wait()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
