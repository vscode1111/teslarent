import { expect } from "chai";
import dayjs from "dayjs";
import { TokenSoldEvent } from "typechain-types/contracts/CarBarContract";
import { toUnixTime } from "utils/common";

import {
  PRICE0,
  PRICE01,
  PRICE1,
  USER_INITIAL_BALANCE0,
  USER_INITIAL_BALANCE012,
  USER_INITIAL_BALANCE1,
  USER_INITIAL_BALANCE2,
  ZERO,
} from "./data";
import { initCollectionsReal, initCollectionsRealWithBuying, vmEsceptionText } from "./utils";

export function shouldBehaveCorrectPayment(): void {
  describe("payment", () => {
    it("should return 0 balances for admin and all users", async function () {
      const adminBalance = await this.adminTestUSDT.balanceOf(this.admin.address);
      expect(adminBalance).to.equal(ZERO);

      const user1Balance = await this.adminTestUSDT.balanceOf(this.user1.address);
      expect(user1Balance).to.equal(ZERO);

      const user2Balance = await this.adminTestUSDT.balanceOf(this.user2.address);
      expect(user2Balance).to.equal(ZERO);
    });

    it("should return correct balances for admin and all users after minting", async function () {
      await this.adminTestUSDT.mint(this.admin.address, USER_INITIAL_BALANCE0);
      await this.adminTestUSDT.mint(this.user1.address, USER_INITIAL_BALANCE1);
      await this.adminTestUSDT.mint(this.user2.address, USER_INITIAL_BALANCE2);

      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.balanceOf(this.admin.address)).to.equal(USER_INITIAL_BALANCE0);
      expect(await this.adminTestUSDT.balanceOf(this.user1.address)).to.equal(USER_INITIAL_BALANCE1);
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(USER_INITIAL_BALANCE2);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE012);
    });

    it("should procced the payment of the token by the user", async function () {
      const collectionIdTest = 0;

      await this.adminTestUSDT.mint(this.user1.address, USER_INITIAL_BALANCE0);
      await initCollectionsReal(this.adminCarBarContract);

      await this.user1TestUSDT.approve(this.adminCarBarContract.address, PRICE0);

      const tx = await this.user1CarBarContract.buyToken(collectionIdTest);
      const receipt = await tx.wait();

      const tokenSoldEvent = receipt.events?.find((item) => item.event === "TokenSold") as TokenSoldEvent;

      expect(tokenSoldEvent).to.not.be.undefined;

      const { collectionId, tokenId, seller, owner, price, timestamp } = tokenSoldEvent?.args;

      const now = Math.round(new Date().getTime() / 1000);

      expect(collectionId).to.be.equal(collectionIdTest);
      expect(tokenId).to.be.equal(0);
      expect(seller).to.be.equal(this.admin.address);
      expect(owner).to.be.equal(this.user1.address);
      expect(price).to.be.equal(PRICE0);
      expect(timestamp).to.be.closeTo(now, 30);

      expect(await this.adminTestUSDT.balanceOf(this.user1.address)).to.equal(USER_INITIAL_BALANCE0.sub(PRICE0));
      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(PRICE0);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should throw error when user tries to buy token withount allowance", async function () {
      await this.adminTestUSDT.mint(this.user1.address, USER_INITIAL_BALANCE0);
      await initCollectionsReal(this.adminCarBarContract);

      await expect(this.user1CarBarContract.buyToken(0)).to.be.rejectedWith(
        vmEsceptionText("User must allow to use of funds"),
      );

      expect(await this.adminTestUSDT.balanceOf(this.user1.address)).to.equal(USER_INITIAL_BALANCE0);
      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should throw error when user tries to buy token withount funds", async function () {
      await initCollectionsReal(this.adminCarBarContract);

      await this.user1TestUSDT.approve(this.adminCarBarContract.address, PRICE01);

      await expect(this.user1CarBarContract.buyToken(0)).to.be.rejectedWith(vmEsceptionText("User must have funds"));

      expect(await this.adminTestUSDT.balanceOf(this.user1.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(ZERO);
    });

    it("should withdraw funds to user2 by admin", async function () {
      await this.adminTestUSDT.mint(this.adminCarBarContract.address, USER_INITIAL_BALANCE0);

      await this.adminCarBarContract.withdraw(this.user2.address, PRICE1);

      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(
        USER_INITIAL_BALANCE0.sub(PRICE1),
      );
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(PRICE1);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should throw error when not admin tries to withdraw token", async function () {
      await this.adminTestUSDT.mint(this.adminCarBarContract.address, USER_INITIAL_BALANCE0);

      await expect(this.user1CarBarContract.withdraw(this.user2.address, PRICE1)).to.be.rejectedWith(
        vmEsceptionText("Ownable: caller is not the owner"),
      );

      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(USER_INITIAL_BALANCE0);
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should throw error when admin tries to withdraw more tokens", async function () {
      await this.adminTestUSDT.mint(this.adminCarBarContract.address, USER_INITIAL_BALANCE0);

      await expect(this.adminCarBarContract.withdraw(this.user2.address, USER_INITIAL_BALANCE1)).to.be.rejectedWith(
        vmEsceptionText("Contract must have sufficient funds"),
      );

      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(USER_INITIAL_BALANCE0);
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should throw error when not admin tries to withdraw token", async function () {
      await this.adminTestUSDT.mint(this.adminCarBarContract.address, USER_INITIAL_BALANCE0);

      await expect(this.user1CarBarContract.withdraw(this.user2.address, PRICE0)).to.be.rejectedWith(
        vmEsceptionText("Ownable: caller is not the owner"),
      );

      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(USER_INITIAL_BALANCE0);
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(ZERO);
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0);
    });

    it("should procced the payment of the token by the user1 and user2", async function () {
      const tokenCount = 5;
      const collectionId0 = 0;
      const collectionId1 = 1;

      await this.adminTestUSDT.mint(this.user1.address, USER_INITIAL_BALANCE0);
      await this.user1TestUSDT.approve(this.adminCarBarContract.address, PRICE01);
      await this.adminTestUSDT.mint(this.user2.address, USER_INITIAL_BALANCE0);
      await this.user2TestUSDT.approve(this.adminCarBarContract.address, PRICE01);
      await initCollectionsReal(this.adminCarBarContract, tokenCount);

      expect(await this.adminCarBarContract.balanceOf(this.admin.address, collectionId0)).to.equal(tokenCount);

      //Check initial state of collection #0
      let tokens = await this.adminCarBarContract.fetchTokens(collectionId0);
      expect(tokens[0].owner).to.equal(this.admin.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[2].owner).to.equal(this.admin.address);
      //Check initial state of collection #1
      tokens = await this.adminCarBarContract.fetchTokens(collectionId1);
      expect(tokens[0].owner).to.equal(this.admin.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[2].owner).to.equal(this.admin.address);

      //User1 buys token of collection #0
      await this.user1CarBarContract.buyToken(collectionId0);
      tokens = await this.adminCarBarContract.fetchTokens(collectionId0);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(await this.adminCarBarContract.balanceOf(this.admin.address, collectionId0)).to.equal(tokenCount - 1);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId0)).to.equal(1);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId0)).to.equal(ZERO);

      //User2 buys token of collection #0
      await this.user2CarBarContract.buyToken(collectionId0);
      tokens = await this.adminCarBarContract.fetchTokens(collectionId0);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[1].owner).to.equal(this.user2.address);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(await this.adminCarBarContract.balanceOf(this.admin.address, collectionId0)).to.equal(tokenCount - 2);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId0)).to.equal(1);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId0)).to.equal(1);

      //Check initial state of collection #1
      tokens = await this.adminCarBarContract.fetchTokens(collectionId1);
      expect(tokens[0].owner).to.equal(this.admin.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[2].owner).to.equal(this.admin.address);

      //User1 buys token of collection #1
      await this.user1CarBarContract.buyToken(collectionId1);
      tokens = await this.adminCarBarContract.fetchTokens(collectionId1);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(await this.adminCarBarContract.balanceOf(this.admin.address, collectionId1)).to.equal(tokenCount - 1);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId1)).to.equal(1);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId1)).to.equal(ZERO);

      //User2 buys token of collection #0
      await this.user2CarBarContract.buyToken(collectionId1);
      tokens = await this.adminCarBarContract.fetchTokens(collectionId1);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[1].owner).to.equal(this.user2.address);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(await this.adminCarBarContract.balanceOf(this.admin.address, collectionId1)).to.equal(tokenCount - 2);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId1)).to.equal(1);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId1)).to.equal(1);

      expect(await this.adminTestUSDT.balanceOf(this.user1.address)).to.equal(USER_INITIAL_BALANCE0.sub(PRICE01));
      expect(await this.adminTestUSDT.balanceOf(this.user2.address)).to.equal(USER_INITIAL_BALANCE0.sub(PRICE01));
      expect(await this.adminTestUSDT.balanceOf(this.adminCarBarContract.address)).to.equal(PRICE01.mul(2));
      expect(await this.adminTestUSDT.totalSupply()).to.equal(USER_INITIAL_BALANCE0.mul(2));
    });

    it("should should throw error when user tries to buy token of an expired collection", async function () {
      const tokenCount = 5;
      const collectionId = 0;

      const newExpiryDate = dayjs().add(-1, "minute").toDate();

      await expect(
        initCollectionsRealWithBuying(this, tokenCount, collectionId, toUnixTime(newExpiryDate)),
      ).to.be.rejectedWith(vmEsceptionText("Collection expiration must be greater than the current time"));
    });
  });
}
