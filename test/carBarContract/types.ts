import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";
import type { CarBarContract } from "typechain-types/contracts/CarBarContract";
import { TestUSDT } from "typechain-types/contracts/TestUSDT";

type Fixture<T> = () => Promise<T>;

export interface ContextBase {
  adminTestUSDT: TestUSDT;
  user1TestUSDT: TestUSDT;
  user2TestUSDT: TestUSDT;
  adminCarBarContract: CarBarContract;
  user1CarBarContract: CarBarContract;
  user2CarBarContract: CarBarContract;
}

declare module "mocha" {
  export interface Context extends ContextBase {
    admin: SignerWithAddress;
    user1: SignerWithAddress;
    user2: SignerWithAddress;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
}

export interface ICollectionItem {
  name: string;
  url: string;
  tokenCount: number;
  price: BigNumber;
  expiryDate: number;
}
