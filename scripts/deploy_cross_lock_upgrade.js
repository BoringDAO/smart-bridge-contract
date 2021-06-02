const { ethers, upgrades } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  // We get the contract to deploy
  const CrossLock = await ethers.getContractFactory("CrossLock");
  const crossLock = await upgrades.deployProxy(CrossLock, { kind: 'uups' })
  //   const crossLock = await CrossLock.deploy(2);
  await crossLock.deployed();
  console.log("CrossLock deployed to:", crossLock.address);

  // add supporting token
  const token0 = "0xa9C744B12AB13Cd4cAC6f3cbbE33113d5DBB09Ee"
  const token1 = "0x9a40dB98775015EB2452754e905e22E087ad3842"
  const crosser = "0xC38068D89B16A1dAe117974F30230F4AFd654B3C"
  const chainID = 97
  const roleKey = await crossLock.getRoleKey(token0, token1, chainID)
  console.log(`role key ${roleKey}`)
  await crossLock.addSupportToken(token0, token1, chainID)
  await crossLock.grantRole(roleKey, crosser)
  await crossLock.setThreshold(token0, 1)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });