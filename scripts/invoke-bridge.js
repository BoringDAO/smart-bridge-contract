async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  // We get the contract to deploy
  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.attach("");

  // grant crosser role
  await bridge.grantRole("CROSSER_ROLE", "");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
