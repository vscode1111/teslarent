import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import type { TestUSDT } from "typechain-types/contracts/TestUSDT";
import type { TestUSDT__factory } from "typechain-types/factories/contracts/TestUSDT__factory";

const func: DeployFunction = async (): Promise<void> => {
  const t0 = new Date();
  console.log("TestUSDT is deploying...");
  const [deployer] = await ethers.getSigners();
  const testUSDTFactory = <TestUSDT__factory>await ethers.getContractFactory("TestUSDT");
  const testUSDT = <TestUSDT>await testUSDTFactory.connect(deployer).deploy();
  await testUSDT.deployed();
  const diff = (new Date().getTime() - t0.getTime()) / 1000;
  console.log(`TestUSDT deployed to: ${testUSDT.address} in ${diff.toFixed()} sec`);
};

func.tags = ["TestUSDT"];

export default func;
