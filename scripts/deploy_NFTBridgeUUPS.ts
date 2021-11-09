import hre from 'hardhat'

async function main() {
    const NFTBridge = await hre.ethers.getContractFactory('NFTBridgeUUPS')
    const Bridge = await hre.upgrades.deployProxy(NFTBridge, {kind:'uups'});

    console.log(`bridge contrat deployed at ${Bridge.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
