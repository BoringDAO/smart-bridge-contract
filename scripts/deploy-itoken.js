const hre = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`${hre.network.name}(${owner.address})`);

  const IToken = await ethers.getContractFactory("TestIToken");
  const iToken = await IToken.deploy("Bridge DAI", "BDAI");
  await iToken.deployed();

  console.log("IToken deployed to:", iToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
