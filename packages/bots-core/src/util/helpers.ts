import BigNumber from "bignumber.js";

export const numberToBigNumber = (num: number | string | BigNumber | bigint): BigNumber => {
    if (typeof num === "string") {
        return BigNumber(num.replace(/,/g, ""));
    } else if (typeof num === "bigint") {
        return BigNumber(num.toString());
    } else {
        return BigNumber(num);
    }
};
