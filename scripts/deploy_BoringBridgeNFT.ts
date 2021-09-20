import { ethers } from "hardhat";

async function main() {
    const bridge = await ethers.getContractFactory("BoringBridgeNFT")
    const nft = await bridge.deploy()
    await nft.deployed()

    //ETH bridge nft contract addresss: 0xfAab33c5DE84a11FCd9CF5B3cC3B525fdd9DbD4A
    //BSC bridge nft contract addresss: 0x3d15932a52c6a51eE373AeF06751771489659C88
    //OKB bridge nft contract addresss: 0xC83B084e9C1d2932Ab389D57b82B9daDf175BE10

    console.log(`bridge contrat deployed at ${nft.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
