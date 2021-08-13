import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import { TwoWay } from "../src/types/TwoWay";

async function main() {
  // let twoWayAddr = '0xACcd94Ada34ff4063d6421BAff0323C26a3c9804'
  // let usdtAddr = '0x55d398326f99059ff775485246999027b3197955'
  // let chainID = 66

  let twoWayAddr = '0xe2E097470E9C73DaF8D71AfAcE1f67898df0D5Cd'
  let usdtAddr = '0x382bB369d343125BfB2117af9c149795C6C65C50'
  let chainID = 56

	let twoWay = await ethers.getContractAt('TwoWay', twoWayAddr) as TwoWay
  const tx = await twoWay.setFee(usdtAddr, chainID, parseEther('0.5'), parseEther('0'))
  console.log(`tx id ${tx.hash}`)
  await tx.wait()
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(-1);
  });
