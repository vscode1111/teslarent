import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { StringNumber } from "types/common";

export function toWei(value: StringNumber, unitName?: BigNumberish): BigNumber {
  return ethers.utils.parseUnits(String(value), unitName);
}

export function toUnixTime(value: string | Date = new Date()): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function numberToByteArray(value: number, bytesNumber = 4): number[] {
  var byteArray = new Array(bytesNumber).fill(0);

  for (var index = byteArray.length - 1; index >= 0; index--) {
    var byte = value & 0xff;
    byteArray[index] = byte;
    value = (value - byte) / 256;
  }

  return byteArray;
}

export function byteArrayToNumber(byteArray: number[]): number {
  var value = 0;
  for (var i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }

  return value;
}
