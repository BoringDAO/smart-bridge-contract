const { upgrades } = require("hardhat");

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);
  console.log(`${hre.network.name}(${user1.address})`);

  // We get the contract to deploy
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await upgrades.deployProxy(Bridge, [55])
  const crossers = [
    "0xC63573cB77ec56e0A1cb40199bb85838D71e4dce",
    "0xF927Bb571eAaB8c9a361AB405c9e4891c5024380",
  ];
  const token0 = "0xA9da1aF46322d2F6257CA9cEe02f2418B5DE5041";
  const token1 = "0xD6Ff436ddD8E87Aa368715F1E1C873fbECccfD2f";
  const feeTo = [
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  ];

//   const bridge = await Bridge.deploy(crossers, token0, token1, feeTo);
  await bridge.deployed();

  console.log("Bridge deployed to:", bridge.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
