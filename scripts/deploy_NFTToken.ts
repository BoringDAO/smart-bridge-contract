import { ethers } from "hardhat";

async function main() {
    const token = await ethers.getContractFactory("BridgeNFT")
    const nft = await token.deploy()
    await nft.deployed()

    // BGNFT:0xbc188DC722eA57d84dcbC8c970E89300020290C5    10/29/23:58  Ropsten
    // BGNFT:0x96c0E865232526e89B3c14C2Ed338519884b9Ed5    10/30/00:24  Kovan
    // BGNFT:0xF0D46075BE048Aa3e200f402ae1AaE60f48Ffb45    10/30/13:25  Kovan
    // BGNFT:0xe6EbBf44d11B5F897D9Dbcba4Aa91FE04e797426    10/30/23:03  Kovan

    console.log(`nft contrat deployed at ${nft.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
