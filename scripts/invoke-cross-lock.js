async function main() {
    const [owner] = await ethers.getSigners();
    console.log(`${hre.network.name}(${owner.address})`);
  
    // We get the contract to deploy
    const CrossLock = await ethers.getContractFactory("CrossLock");
    const crossLock = await CrossLock.attach("")
  
    // add supporting token
    const fromToken = "",
    const toToken = "";
    const roleFlag = ""
    await crossLock.addSupportToken(fromToken, toToken, roleFlag);
    
    // grant role
    await crossLock.grantRole(roleFlag, "");
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  