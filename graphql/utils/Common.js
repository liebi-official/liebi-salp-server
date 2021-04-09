import BigNumber from "bignumber.js";

// return bignumber format. Only valid for single layer filed.
export const getSumOfAFieldFromList = (list, field) => {
    return list
    .map((item) => new BigNumber(item[field]))
    .reduce((a, b) => a.plus(b), new BigNumber(0));
  }