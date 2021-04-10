import BigNumber from "bignumber.js";

// return bignumber format. Only valid for single layer filed.
export const getSumOfAFieldFromList = (list, field) => {
  return list
    .map((item) => new BigNumber(item[field]))
    .reduce((a, b) => a.plus(b), new BigNumber(0));
};

// 随机数生成底层函数
const getRandomChars = (randomChars, length) => {
  var result = "";
  if (randomChars.length == 0) return result;

  for (var i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
};

// 默认配置的随机数长度分布
const INIT_RANDOM_CONFIG = {
  lowercase: 0,
  uppercase: 2,
  numeric: 4,
};

// 组合生成随机数
export const getRandomCombination = (randomConfig = INIT_RANDOM_CONFIG) => {
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numericChars = "0123456789";

  let result = "";

  if (randomConfig.lowercase != 0) {
    result += getRandomChars(lowercaseChars, randomConfig.lowercase);
  }

  if (randomConfig.uppercase != 0) {
    result += getRandomChars(uppercaseChars, randomConfig.uppercase);
  }

  if (randomConfig.numericChars != 0) {
    result += getRandomChars(numericChars, randomConfig.numeric);
  }

  return result;
};
