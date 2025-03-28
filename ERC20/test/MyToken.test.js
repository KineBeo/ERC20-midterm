const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken, token, owner, addr1, addr2;

  beforeEach(async function () {
    MyToken = await ethers.getContractFactory("MyToken");
    [owner, addr1, addr2] = await ethers.getSigners();
    console.log(owner.address);
    token = await MyToken.deploy(10000000, 10, 1000); // Cap = 10 triệu, reward = 10, rewardRate = 1000
    await token.waitForDeployment();
  });

  it("Should assign the initial supply to the owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("5000000", 18));
  });

  it("Should allow owner to mint tokens", async function () {
    await token.mint(addr1.address, ethers.parseUnits("1000", 18));
    expect(await token.balanceOf(addr1.address)).to.equal(
      ethers.parseUnits("1000", 18)
    );
  });

  it("Should transfer tokens with fee", async function () {
    await token.mint(addr1.address, ethers.parseUnits("1000", 18));

    // Addr1 gửi 1000 token cho Addr2, phí sẽ là 1 token (0.1%)
    await token
      .connect(addr1)
      .transfer(addr2.address, ethers.parseUnits("1000", 18));

    const balanceAddr2 = await token.balanceOf(addr2.address);
    const balanceOwner = await token.balanceOf(owner.address);

    expect(balanceAddr2).to.equal(ethers.parseUnits("999", 18)); // Nhận được 999 (sau khi trừ phí)
    expect(balanceOwner).to.be.gt(ethers.parseUnits("5000000", 18)); // Owner nhận 1 token phí
  });

  it("Should allow owner to change fee percentage", async function () {
    await token.setFeePercent(50); // 0.5% fee
    console.log(await token.feePercent());
    expect(await token.feePercent()).to.equal(50);
  });

  it("Owner có thể sửa feePercent", async function () {
    // Kiểm tra fee mặc định là 10
    expect(await token.feePercent()).to.equal(10);

    // Owner cập nhật phí thành 50 (0.5%)
    await token.setFeePercent(50);
    expect(await token.feePercent()).to.equal(50);
  });

  it("Không phải owner không thể sửa feePercent", async function () {
    await expect(token.connect(addr1).setFeePercent(50)).to.be.revertedWith(
      "Only the owner can call this function"
    );
  });

  it("Không thể set phí vượt 1%", async function () {
    await expect(token.setFeePercent(200)).to.be.revertedWith(
      "Fee cannot exceed 1%"
    );
  });

  it("Should freeze contract and prevent transfers", async function () {
    await token.freezeContract();
    await expect(
      token.transfer(addr1.address, ethers.parseUnits("10", 18))
    ).to.be.revertedWith("Contract is frozen and transfers are disabled");
  });

  it("Should increase user balance over time", async function () {
    await token.mint(addr1.address, ethers.parseUnits("1000", 18));

    // Đợi 10 giây để tích lũy reward
    await network.provider.send("evm_increaseTime", [10]);
    await network.provider.send("evm_mine");

    // Claim reward
    await token.connect(addr1).claimReward();

    const newBalance = await token.balanceOf(addr1.address);
    expect(newBalance).to.be.gt(ethers.parseUnits("1000", 18));
  });
});
