const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  // We get the contract to deploy
  const CrossLock = await ethers.getContractFactory("CrossLock");
  const crossLock = await CrossLock.deploy(2);
  await crossLock.deployed();

  console.log("CrossLock deployed to:", crossLock.address);

  // add supporting token
  const fromToken = "0xA9da1aF46322d2F6257CA9cEe02f2418B5DE5041"
  const toToken = "0xD6Ff436ddD8E87Aa368715F1E1C873fbECccfD2f"
  const test_role = "test"
  const roleFlag = ethers.utils.formatBytes32String(test_role)
  console.log(`${roleFlag}`)
  await crossLock.addSupportToken(fromToken, toToken, roleFlag);
  await crossLock.grantRole(roleFlag, "0xC63573cB77ec56e0A1cb40199bb85838D71e4dce")
  await crossLock.grantRole(roleFlag, "0xF927Bb571eAaB8c9a361AB405c9e4891c5024380")

  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
