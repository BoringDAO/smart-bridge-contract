const { upgrades, network } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);
  // console.log(`${hre.network.name}(${user1.address})`);

  // We get the contract to deploy
  let networkid = 1666600000
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await upgrades.deployProxy(Bridge, [networkid], {kind: 'uups'})
  const crossers = [
    "0xbC41ef18DfaE72b665694B034f608E6Dfe170149"
  ];
  const token0 = "0xBC19712FEB3a26080eBf6f2F7849b417FdD792CA";
  const token1 = "0x11E4BED429b239a1A0C594ADEB71b99e8Fa1011A";
  const feeTo = [
    "0x09587012B3670D75a90930be9282d98063E402a2"
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
