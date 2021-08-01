const { ethers } = require("hardhat");

async function main() {
//     const [owner, user1] = await ethers.getSigners()
//     const CrossLock = await ethers.getContractFactory("CrossLock");
//     const cl = await CrossLock.attach("0x07a2a667aA1c490C6473A2CC1EF5647FA7f08410")
//     const Itoken = await ethers.getContractFactory("TestIToken")
//     const t = await Itoken.attach("0xA9da1aF46322d2F6257CA9cEe02f2418B5DE5041")
//     await t.approve(cl.address, ethers.utils.parseEther("100000"))
//     await cl.lock(t.address, user1.address, ethers.utils.parseEther("10"))
	const fin = await ethers.getContractAt("Token", "0x8D3573f24c0aa3819A2f5b02b2985dD82B487715")
	const amount = await fin.allowance("0x21314F0F9d79150622179D6D10a68B90F6bCD9c6", "0x2B21237BA30deF78EC551a10C99d656F90Eb10fC")
	console.log(`amount: ${ethers.utils.formatEther(amount)}`)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });