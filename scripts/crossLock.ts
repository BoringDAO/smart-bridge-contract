import { attach } from "./helper";
import { CrossLock } from "../src/types/CrossLock"


async function main() {
	let cl = await attach("CrossLock", "0x0771017cbf77b5a4551864ad1461c6e8ea4bd506") as CrossLock
	// let cl = await attach("CrossLock", "0x687d761089193dD5bb1C33a04cFeB6F18e6b9B3d") as CrossLock
	// let admin = await cl.DEFAULT_ADMIN_ROLE()
	// console.log(`admin ${admin}`)
	cl.
	let tx = await cl.initialize()
	await tx.wait()
	// let adminNew = await cl.DEFAULT_ADMIN_ROLE()
	// console.log(`adminNew ${admin}`)
}


main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});