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

export const getScaledAmount = (amount: number | string | BigNumber, decimals: number): bigint => {
    const safeAmount = numberToBigNumber(amount);

    if (decimals > 0) {
        return BigInt(safeAmount.times(Math.pow(10, decimals)).toFixed());
    } else {
        return BigInt(safeAmount.toFixed());
    }
};

export const getUnScaledAmount = (amount: number | string | bigint | BigNumber, decimals: number): BigNumber => {
    if (decimals > 0) {
        return numberToBigNumber(amount).div(Math.pow(10, decimals));
    } else {
        return numberToBigNumber(amount);
    }
};
