const hre = require("hardhat");

async function main() {
  const Wall = await hre.ethers.getContractFactory("Wall");
  const wall = await Wall.deploy("Hello, world!");

  await wall.deployed();

  console.log("Wall deployed to:", wall.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
