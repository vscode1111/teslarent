import { CONTRACTS } from "constants/addresses";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getTestCollections } from "test/carBarContract/data";
import type { CarBarContract } from "typechain-types/contracts/CarBarContract";
import type { CarBarContract__factory } from "typechain-types/factories/contracts/CarBarContract__factory";
import { DeployNetworks } from "types/common";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  const t0 = new Date();

  const {
    ethers,
    network: { name },
  } = hre;
  const contractAddress = CONTRACTS.CAR_BAR[name as keyof DeployNetworks];

  console.log(`CarBarContract [${contractAddress}] is initiating...`);

  const [admin] = await hre.ethers.getSigners();

  const carBarContractFactory = <CarBarContract__factory>await ethers.getContractFactory("CarBarContract");
  const carBarContract = <CarBarContract>await carBarContractFactory.connect(admin).attach(contractAddress);
  const collections = getTestCollections();

  for (const collection of collections) {
    const name = collection.name;
    console.log(`Sending transaction for collection "${name}"...`);
    const tx = await carBarContract.createCollection(
      collection.name,
      collection.url,
      collection.tokenCount,
      collection.price,
      collection.expiryDate,
    );
    console.log(`Sent transaction for collection "${name}"`);
    await tx.wait();
    console.log(`Collection "${name}" was mined`);
  }

  const diff = (new Date().getTime() - t0.getTime()) / 1000;
  console.log(`CarBarContract initialization was finished in ${diff.toFixed()} sec`);
};

func.tags = ["CarBarContract:init"];

export default func;
