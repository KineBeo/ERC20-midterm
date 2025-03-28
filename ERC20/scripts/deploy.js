const { ethers } = require("hardhat");

async function main() {
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy(10000000, 10, 1000); // Đảm bảo cap >= 5 triệu

  await token.waitForDeployment(); // Dùng waitForDeployment() thay vì deployed()

  console.log("Token deployed to:", await token.getAddress()); // Sử dụng getAddress()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });