import BigNumber from "bignumber.js";
import dotenv from "dotenv";
dotenv.config();

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

// campaign表初始化
const INVITATION_START_TIME = parseInt(process.env.INVITATION_START_TIME);
const INVITATION_END_TIME = parseInt(process.env.INVITATION_END_TIME);
const SALP_START_TIME = parseInt(process.env.SALP_START_TIME);
const SALP_END_TIME = parseInt(process.env.SALP_END_TIME);
const SALP_TARGET = process.env.SALP_TARGET;
const EARLY_BIRD_COEFFICIENT = parseFloat(process.env.EARLY_BIRD_COEFFICIENT);
const EARLY_BIRD_INVITATION_COEFFICIENT = parseFloat(
  process.env.EARLY_BIRD_INVITATION_COEFFICIENT
);
const SUCCESSFUL_AUCTION_REWARD_COEFFICIENT = parseFloat(
  process.env.SUCCESSFUL_AUCTION_REWARD_COEFFICIENT
);
const SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT = parseFloat(
  process.env.SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT
);

// 初始化salpOverview表和coefficients表
export const campaignInfoInitialization = async (models) => {
  const initCampaignData = {
    channel_target: SALP_TARGET,
    multisig_account_balance: "0",
    invitation_start_time: INVITATION_START_TIME,
    invitation_end_time: INVITATION_END_TIME,
    salp_start_time: SALP_START_TIME,
    salp_end_time: SALP_END_TIME,
    campaign_status: "bidding",
  };

  await models.SalpOverviews.create(initCampaignData);

  // 默认初始值
  const initCoefficientData = {
    early_bird_coefficient: EARLY_BIRD_COEFFICIENT,
    early_bird_invitation_coefficient: EARLY_BIRD_INVITATION_COEFFICIENT,
    successful_auction_reward_coefficient: SUCCESSFUL_AUCTION_REWARD_COEFFICIENT,
    successful_auction_royalty_coefficient: SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT,
  };

  await models.Coefficients.create(initCoefficientData);
};
