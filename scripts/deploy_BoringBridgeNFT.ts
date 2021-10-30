import { ethers } from "hardhat";

async function main() {
    const bridge = await ethers.getContractFactory("BoringBridgeNFT")
    const nft = await bridge.deploy()
    await nft.deployed()

    // 

    console.log(`bridge contrat deployed at ${nft.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
