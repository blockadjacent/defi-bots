import BigNumber from "bignumber.js";

export const numberToBigNumber = (num: number | string | BigNumber | BigInt): BigNumber => {
  if (typeof num === "string") {
    return BigNumber(num.replace(/,/g, ""));
  } else if (typeof num === "bigint" || num instanceof BigInt) {
    return BigNumber(num.toString());
  } else {
    return BigNumber(num);
  }
};
