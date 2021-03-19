async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  // We get the contract to deploy
  const Bridge = await ethers.getContractFactory("Bridge");
  const crossers = [
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  ];
  const token0 = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
  const token1 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const feeTo = [
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  ];

  const bridge = await Bridge.deploy(crossers, token0, token1, feeTo);
  await bridge.deployed();

  console.log("Bridge deployed to:", bridge.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
