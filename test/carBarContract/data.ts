import { BigNumber } from "ethers";
import { toUnixTime, toWei } from "utils/common";

import { ICollectionItem } from "./types";

// export const TOKEN_COUNT = 300;
export const TOKEN_COUNT = 60;

export const TUSDT_DECIMALS = 6;

export const PRICE0 = toWei(100, TUSDT_DECIMALS);
export const PRICE1 = toWei(160, TUSDT_DECIMALS);
export const PRICE2 = toWei(160, TUSDT_DECIMALS);
export const PRICE01 = PRICE0.add(PRICE1);

export const ZERO = toWei(0);

export const USER_INITIAL_BALANCE0 = toWei(1000, TUSDT_DECIMALS);
export const USER_INITIAL_BALANCE1 = toWei(2000, TUSDT_DECIMALS);
export const USER_INITIAL_BALANCE2 = toWei(3000, TUSDT_DECIMALS);
export const USER_INITIAL_BALANCE01 = USER_INITIAL_BALANCE0.add(USER_INITIAL_BALANCE1);
export const USER_INITIAL_BALANCE012 = USER_INITIAL_BALANCE0.add(USER_INITIAL_BALANCE1).add(USER_INITIAL_BALANCE2);

// export const END_TIME_2023 = toUnixTime("2023-12-31 23:59:59");
export const END_TIME_2023 = toUnixTime("2023-04-30 23:59:59");

// const PRICE_DIV = BigNumber.from('1');
const PRICE_DIV = BigNumber.from("1000");

export function getTestCollections(tokenCount = TOKEN_COUNT, expiryDate = END_TIME_2023): ICollectionItem[] {
  return [
    {
      name: "Tesla Model 3 Stnd (1 Day)",
      url: "https://carbar.io/nft/Tesla_Model_3_Stnd.png",
      tokenCount,
      price: PRICE0.div(PRICE_DIV),
      expiryDate,
    },
    {
      name: "Tesla Model 3 Prfm (1 Day)",
      url: "https://carbar.io/nft/Tesla_Model_3_Prfm.png",
      tokenCount,
      price: PRICE1.div(PRICE_DIV),
      expiryDate,
    },
    {
      name: "Tesla Model Y (1 Day)",
      url: "https://carbar.io/nft/Tesla_Y.png",
      tokenCount,
      price: PRICE2.div(PRICE_DIV),
      expiryDate,
    },
  ];
}
