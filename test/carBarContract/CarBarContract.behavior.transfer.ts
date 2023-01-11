import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import dayjs from "dayjs";
import { numberToByteArray, toUnixTime } from "utils/common";

import { END_TIME_2023, PRICE0, PRICE01, PRICE1, USER_INITIAL_BALANCE0, ZERO } from "./data";
import { initCollectionsReal, initCollectionsRealWithBuying, vmEsceptionText } from "./utils";

export function shouldBehaveCorrectTransfer(): void {
  describe("transfer", () => {
    it("should correct call safeTransferFrom", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      await initCollectionsRealWithBuying(this, tokenCount, collectionId);

      await this.user1CarBarContract.safeTransferFrom(
        this.user1.address,
        this.user2.address,
        0,
        1,
        numberToByteArray(0),
      );

      let tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user2.address);
      expect(tokens[0].sold).to.equal(true);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[1].sold).to.equal(false);
    });

    it("should throw error when user1 tries to call safeTransferFrom", async function () {
      await initCollectionsRealWithBuying(this);
      await expect(
        this.user1CarBarContract.safeTransferFrom(this.user1.address, this.user2.address, 0, 1, numberToByteArray(1)),
      ).to.be.rejectedWith(vmEsceptionText("You must be owner of this token"));
    });

    it("should throw error when user1 tries to call safeTransferFrom", async function () {
      await initCollectionsRealWithBuying(this);
      await expect(
        this.user1CarBarContract.safeTransferFrom(this.user1.address, this.user2.address, 0, 2, numberToByteArray(0)),
      ).to.be.rejectedWith(vmEsceptionText("Amount must be 1"));
    });

    it("should throw error when user1 tries to call safeBatchTransferFrom with incorrect length of ids and amounts", async function () {
      await initCollectionsRealWithBuying(this);
      await expect(
        this.adminCarBarContract.safeBatchTransferFrom(this.user1.address, this.user2.address, [1], [1, 2], []),
      ).to.be.rejectedWith(vmEsceptionText("Length of ids, amounts and data should be the correct"));
    });

    it("should throw error when user1 tries to call safeBatchTransferFrom with incorrect length of ids and data", async function () {
      await initCollectionsRealWithBuying(this);
      await expect(
        this.adminCarBarContract.safeBatchTransferFrom(
          this.user1.address,
          this.user2.address,
          [1],
          [1],
          numberToByteArray(0, 2),
        ),
      ).to.be.rejectedWith(vmEsceptionText("Length of ids, amounts and data should be the correct"));
    });

    it("should throw error when user1 tries to call safeBatchTransferFrom with incorrect array of amounts", async function () {
      await initCollectionsRealWithBuying(this);
      await expect(
        this.adminCarBarContract.safeBatchTransferFrom(
          this.user1.address,
          this.user2.address,
          [0],
          [2],
          numberToByteArray(0),
        ),
      ).to.be.rejectedWith(vmEsceptionText("Amount must be 1"));
    });

    it("should correct call safeBatchTransferFrom", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      await this.adminTestUSDT.mint(this.user1.address, USER_INITIAL_BALANCE0);
      await this.user1TestUSDT.approve(this.adminCarBarContract.address, PRICE0.mul(2));
      await initCollectionsReal(this.adminCarBarContract, tokenCount, END_TIME_2023);
      await this.user1CarBarContract.buyToken(collectionId);
      await this.user1CarBarContract.buyToken(collectionId);

      let tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[0].sold).to.equal(true);
      expect(tokens[1].owner).to.equal(this.user1.address);
      expect(tokens[1].sold).to.equal(true);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(tokens[2].sold).to.equal(false);

      await this.user1CarBarContract.safeBatchTransferFrom(
        this.user1.address,
        this.user2.address,
        [0, 0],
        [1, 1],
        [...numberToByteArray(0), ...numberToByteArray(1)],
      );

      tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user2.address);
      expect(tokens[0].sold).to.equal(true);
      expect(tokens[1].owner).to.equal(this.user2.address);
      expect(tokens[1].sold).to.equal(true);
      expect(tokens[2].owner).to.equal(this.admin.address);
      expect(tokens[2].sold).to.equal(false);
    });

    it("should procced the transfer of the token from user1 and user2", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      const tokenId = 0;

      await initCollectionsRealWithBuying(this, tokenCount, collectionId);

      let tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user1.address);
      expect(tokens[0].sold).to.equal(true);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[1].sold).to.equal(false);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId)).to.equal(1);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId)).to.equal(ZERO);

      await this.user1CarBarContract.transferToken(this.user1.address, this.user2.address, collectionId, tokenId);

      tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user2.address);
      expect(tokens[0].sold).to.equal(true);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(tokens[1].sold).to.equal(false);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId)).to.equal(ZERO);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId)).to.equal(1);
    });

    it("should should throw error when user tries to transfer not his token", async function () {
      await initCollectionsRealWithBuying(this);

      await expect(
        this.user1CarBarContract.transferToken(this.user1.address, this.user2.address, 1, 1),
      ).to.be.rejectedWith(vmEsceptionText("You must be owner of this token"));
    });

    it("should should throw error when user tries to transfer token of an expired collection", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      const tokenId = 0;

      const newCollectionExpiryDate = dayjs().add(1, "minute").toDate();

      await initCollectionsRealWithBuying(this, tokenCount, collectionId, toUnixTime(newCollectionExpiryDate));

      const newTokenExpiryDate = dayjs().add(1, "minute").toDate();

      await time.increaseTo(toUnixTime(newTokenExpiryDate));

      await expect(
        this.user1CarBarContract.transferToken(this.user1.address, this.user2.address, collectionId, tokenId),
      ).to.be.rejectedWith(vmEsceptionText("Collection expiration must be greater than the current time"));
    });

    it("should procced the transfer of the updated token", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      const tokenId = 0;

      await initCollectionsRealWithBuying(this, tokenCount, collectionId);

      const newExpiryDate = dayjs().add(3, "day").add(1, "minute").toDate();

      await this.adminCarBarContract.updateToken(collectionId, tokenId, toUnixTime(newExpiryDate));

      await this.user1CarBarContract.transferToken(this.user1.address, this.user2.address, collectionId, tokenId);

      const tokens = await this.adminCarBarContract.fetchTokens(collectionId);
      expect(tokens[0].owner).to.equal(this.user2.address);
      expect(tokens[1].owner).to.equal(this.admin.address);
      expect(await this.adminCarBarContract.balanceOf(this.user1.address, collectionId)).to.equal(ZERO);
      expect(await this.adminCarBarContract.balanceOf(this.user2.address, collectionId)).to.equal(1);
    });

    it("should should throw error when user tries to transfer expired token", async function () {
      const tokenCount = 5;
      const collectionId = 0;
      const tokenId = 0;

      await initCollectionsRealWithBuying(this, tokenCount, collectionId);

      const newExpiryDate = dayjs().add(-1, "minute").toDate();

      await this.adminCarBarContract.updateToken(collectionId, tokenId, toUnixTime(newExpiryDate));

      await expect(
        this.user1CarBarContract.transferToken(this.user1.address, this.user2.address, collectionId, tokenId),
      ).to.be.rejectedWith(
        vmEsceptionText("Token expiration must be more than a certain period from the current time"),
      );
    });
  });
}
