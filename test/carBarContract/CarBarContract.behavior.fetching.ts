import { expect } from "chai";
import { toUnixTime } from "utils/common";

import { checkToken, getCollectionName, getCollectionUrl, initCollections } from "./utils";

export function shouldBehaveCorrectFetching(): void {
  describe("fetching", () => {
    it("should return the correct URI once it's changed", async function () {
      const testText = "Test URI";
      await this.adminCarBarContract.setURI(testText);
      const result = await this.adminCarBarContract.uri(1);
      expect(result).to.equal(testText);
    });

    it("should return the correct collections and tokens", async function () {
      const collectionCount = 3;
      const adminAddress = this.admin.address;

      const resultTokenCount = await this.adminCarBarContract.getCollectionCount();
      expect(resultTokenCount).to.equal(0);

      await initCollections(this.adminCarBarContract, collectionCount);

      const collections = await this.adminCarBarContract.fetchCollections();

      expect(collections.length).to.equal(collectionCount);

      for (let i = 0; i < collectionCount; i++) {
        const collection = collections[i];

        const balance = await this.adminCarBarContract.balanceOf(adminAddress, collection.collectionId);
        expect(balance).to.eq(collection.tokenCount);

        expect(collection.collectionId).to.eq(i);
        expect(collection.name).to.eq(getCollectionName(i));
        expect(collection.url).to.eq(getCollectionUrl(i));
        expect(collection.tokenCount).to.eq(i + 1);
        expect(collection.price).to.eq(i + 2);
        expect(collection.expiryDate).to.eq(i + 3);

        const tokens = await this.adminCarBarContract.fetchTokens(collection.collectionId);
        const tokenCount = collection.tokenCount;
        expect(tokens.length).to.eq(tokenCount);

        for (let j = 0; j < tokenCount; j++) {
          const token = tokens[i];
          checkToken(token, i, adminAddress);

          const fetchToken = await this.adminCarBarContract.fetchToken(collection.collectionId, i);
          checkToken(fetchToken, i, adminAddress);
        }
      }
    });

    it("Should correct update certain collection", async function () {
      const collectionCount = 3;
      const collectionId = 0;

      await initCollections(this.adminCarBarContract, collectionCount);

      await this.adminCarBarContract.updateCollection(collectionId, getCollectionName(10), getCollectionUrl(11));

      const collection = await this.adminCarBarContract.fetchCollection(collectionId);

      expect(collection.collectionId).to.eq(collectionId);
      expect(collection.name).to.eq(getCollectionName(10));
      expect(collection.url).to.eq(getCollectionUrl(11));
      expect(collection.tokenCount).to.eq(collectionId + 1);
      expect(collection.price).to.eq(collectionId + 2);
      expect(collection.expiryDate).to.eq(collectionId + 3);
    });

    it("Should correct update certain token", async function () {
      const collectionCount = 3;
      const collectionId = 0;
      const tokenId = 0;
      const newExpiryDate = toUnixTime();

      await initCollections(this.adminCarBarContract, collectionCount);

      let token = await this.adminCarBarContract.fetchToken(collectionId, tokenId);
      const owner = token.owner;
      const sold = token.sold;

      await this.adminCarBarContract.updateToken(collectionId, tokenId, newExpiryDate);

      token = await this.adminCarBarContract.fetchToken(collectionId, tokenId);

      expect(token.tokenId).to.eq(tokenId);
      expect(token.owner).to.eq(owner);
      expect(token.expiryDate).to.eq(newExpiryDate);
      expect(token.sold).to.eq(sold);
    });

    it("should correct USDT address", async function () {
      const result = await this.adminCarBarContract.getUSDTaddress();
      expect(result).to.eq(this.adminTestUSDT.address);
    });
  });
}
