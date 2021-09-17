import { ethers } from "hardhat";

async function main() {
    const bridge = await ethers.getContractFactory("BoringBridgeNFT")
    const nft = await bridge.deploy()
    await nft.deployed()

    // contract addresss: 0x12cb82E378dCE86c04FaC1DcED5F6238d7703133
    console.log(`singup contrat deployed at ${nft.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
