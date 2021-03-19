const { expect } = require("chai");

describe("PegSwapPair contract", function () {
  let dai;
  let daiPair;
  let borDAI;
  let pegSwap;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const DAI = await ethers.getContractFactory("TestERC20");
    dai = await DAI.deploy("DAI stable coin", "DAI");
    await dai.deployed();

    const DAICrossToken = await ethers.getContractFactory("CrossToken");
    borDAI = await DAICrossToken.deploy(
      "Boring DAI token",
      "BorDAI",
      owner.address,
      owner.address
    );
    await borDAI.deployed();

    const DAIPair = await ethers.getContractFactory("PegSwapPair");
    daiPair = await DAIPair.deploy("DAI pair", "DAI-PAIR");
    await daiPair.initialize(dai.address, borDAI.address);
    expect(await daiPair.token0()).to.equal(dai.address);
    expect(await daiPair.token1()).to.equal(borDAI.address);
    const reserves = await daiPair.getReserves();
    expect(reserves[0]).to.equal(0);

    // deploy PegSwap
    const PegSwap = await ethers.getContractFactory("PegSwap");
    pegSwap = await PegSwap.deploy();
    await pegSwap.deployed();
  });

  describe("Reverse action", function () {
    it("Should revert when invoke mint/burn/swap directly", async function () {
      await expect(daiPair.mint(owner.address)).to.be.revertedWith(
        "Insufficient liquidity minted"
      );

      // TODO: should add require?
      await expect(daiPair.burn(owner.address)).to.be.revertedWith(
        "division by zero"
      );

      await expect(daiPair.swap(owner.address)).to.be.revertedWith(
        "Swap amount should be greater than 0"
      );
    });
  });

  it("Should revert when invoke addLiquidity directly", async function () {
    await expect(
      pegSwap.addLiquidity(dai.address, 1, owner.address)
    ).to.be.revertedWith("Not support this token");

    expect(await pegSwap.addPair(dai.address, daiPair.address));

    await expect(
      pegSwap.connect(addr1).addLiquidity(dai.address, 1, owner.address)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    await dai.transfer(addr1.address, 1000);
    expect(await dai.balanceOf(addr1.address)).to.equal(1000);

    await expect(
      pegSwap.connect(addr1).addLiquidity(dai.address, 1, addr1.address)
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

    await dai.connect(addr1).approve(pegSwap.address, 1000);

    await pegSwap.connect(addr1).addLiquidity(dai.address, 100, addr1.address);
    expect(await daiPair.balanceOf(addr1.address)).to.equal(100); // Should get 100 liquidity
    expect(await dai.balanceOf(addr1.address)).to.equal(900);
    expect(await dai.balanceOf(daiPair.address)).to.equal(100);

    await daiPair.connect(addr1).approve(pegSwap.address, 1000);
    await pegSwap
      .connect(addr1)
      .removeLiquidity(dai.address, 50, addr1.address);
    expect(await daiPair.balanceOf(addr1.address)).to.equal(50); // Should get 100 liquidity
    expect(await dai.balanceOf(addr1.address)).to.equal(950);
    expect(await dai.balanceOf(daiPair.address)).to.equal(50);
    let reserves = await daiPair.getReserves();
    expect(reserves[0].toNumber()).to.equal(50);
    expect(reserves[1].toNumber()).to.equal(0);

    await borDAI.crossMint(owner.address, addr1.address, 100, "0x123");
    await borDAI.connect(addr1).approve(pegSwap.address, 100);
    await pegSwap.connect(addr1).swap(dai.address, 10, addr1.address);

    expect(await borDAI.balanceOf(addr1.address)).to.equal(90); // Should get 100 liquidity
    expect(await dai.balanceOf(addr1.address)).to.equal(960);
    expect(await dai.balanceOf(daiPair.address)).to.equal(40);
    expect(await borDAI.balanceOf(daiPair.address)).to.equal(10);
    reserves = await daiPair.getReserves();
    expect(reserves[0].toNumber()).to.equal(40);
    expect(reserves[1].toNumber()).to.equal(10);

    await pegSwap
      .connect(addr1)
      .removeLiquidity(dai.address, 10, addr1.address);
    reserves = await daiPair.getReserves();
    expect(await borDAI.balanceOf(addr1.address)).to.equal(92); // Should get 100 liquidity
    expect(await dai.balanceOf(addr1.address)).to.equal(968);
    expect(await dai.balanceOf(daiPair.address)).to.equal(32);
    expect(await borDAI.balanceOf(daiPair.address)).to.equal(8);
    expect(reserves[0].toNumber()).to.equal(32);
    expect(reserves[1].toNumber()).to.equal(8);
  });
});
