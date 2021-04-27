import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { sequelize } from "../../server/models";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT; // 多签账户地址
export const KSM_RESERVATION_AMOUNT = 1000000000; // 1^10 = 0.01 KSM

// *************************
// return bignumber format. Only valid for single layer filed.
export const getSumOfAFieldFromList = (list, field) => {
  return list
    .map((item) => new BigNumber(item[field]))
    .reduce((a, b) => a.plus(b), new BigNumber(0));
};

// *************************
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
  uppercase: 2,
  numeric: 4,
};

// 组合生成随机数
export const getRandomCombination = (randomConfig = INIT_RANDOM_CONFIG) => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numericChars = "0123456789";

  let result = "";
  if (randomConfig.uppercase != 0) {
    result += getRandomChars(uppercaseChars, randomConfig.uppercase);
  }

  if (randomConfig.numericChars != 0) {
    result += getRandomChars(numericChars, randomConfig.numeric);
  }

  return result;
};

// *************************
// campaign表初始化
const INVITATION_START_TIME = parseInt(process.env.INVITATION_START_TIME);
const INVITATION_END_TIME = parseInt(process.env.INVITATION_END_TIME);
const SALP_WHITELIST_AHEAD_HOURS = parseInt(
  process.env.SALP_WHITELIST_AHEAD_HOURS
);
const SALP_START_TIME = parseInt(process.env.SALP_START_TIME);
const SALP_END_TIME = parseInt(process.env.SALP_END_TIME);
const SALP_TARGET = process.env.SALP_TARGET;
const SUCCESSFUL_AUCTION_REWARD_COEFFICIENT = parseFloat(
  process.env.SUCCESSFUL_AUCTION_REWARD_COEFFICIENT
);
const SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT = parseFloat(
  process.env.SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT
);

const SECONDS_PER_HOUR = 60 * 60;

// 初始化salpOverview表和coefficients表
export const campaignInfoInitialization = async (models) => {
  const initCampaignData = {
    channel_target: SALP_TARGET,
    invitation_start_time: INVITATION_START_TIME,
    invitation_end_time: INVITATION_END_TIME,
    salp_whitelist_start_time:
      SALP_START_TIME - SECONDS_PER_HOUR * SALP_WHITELIST_AHEAD_HOURS,
    salp_start_time: SALP_START_TIME,
    salp_end_time: SALP_END_TIME,
    campaign_status: "bidding",
  };

  await models.SalpOverviews.create(initCampaignData);

  // 默认初始值
  const initCoefficientData = {
    successful_auction_reward_coefficient: SUCCESSFUL_AUCTION_REWARD_COEFFICIENT,
    successful_auction_royalty_coefficient: SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT,
  };

  await models.Coefficients.create(initCoefficientData);
};

// *************************
// 获取个人contributions的总额
export const getPersonalContributions = async (account, models) => {
  if (!account) return;

  const condition = {
    where: { $and: [{ from: account }, { to: MULTISIG_ACCOUNT }] },
    raw: true,
    include: [
      {
        model: models.InvitationCodes,
      },
    ],
  };

  const personalContributionList = await models.Transactions.findAll(condition);

  if (personalContributionList.length == 0) {
    return {
      personalContributions: new BigNumber(0),
      personalContributionList: [],
    };
  }

  const personalContributions = getSumOfAFieldFromList(
    personalContributionList,
    "amount"
  );

  return { personalContributions, personalContributionList };
};

// *************************
// 获取某账号下线的contributions的总额
export const getInvitationData = async (account, models) => {
  if (!account) return;

  let condition = {
    where: {
      $and: [{ invited_by_address: account }, { if_authenticated: true }],
    },
    include: [
      {
        model: models.Transactions,
        right: true, // will create a right join
      },
    ],
    raw: true, // 获取object array
  };

  const accountInvitationList = await models.InvitationCodes.findAll(condition);

  let invitationContributions = new BigNumber(0);
  if (accountInvitationList.length != 0) {
    invitationContributions = getSumOfAFieldFromList(
      accountInvitationList,
      "transactions.amount"
    );
  }

  condition = {
    where: {
      $and: [{ invited_by_address: account }, { if_authenticated: true }],
    },
    raw: true, // 获取object array
  };
  const accountInviteeList = await models.InvitationCodes.findAll(condition);
  let uniqueInvitees = accountInviteeList.length;

  return {
    numberOfInvitees: uniqueInvitees,
    invitationContributions,
    accountInvitationList,
  };
};

// *************************
// 查询用户是否是在白名单内。是否在白名单内有两个条件，第1是有邀请码记录。第2是if_authenticated是true的状态。
export const queryIfReserved = async (account, models) => {
  const condition = { where: { inviter_address: account } };
  const rs = await models.InvitationCodes.findOne(condition);

  if (rs) {
    if (rs.if_authenticated == false) {
      // 查询有没有符合时间段的交易（1.时间，2.金额）
      const auth = await authenticateReserveTransaction(account, models);
      if (auth) {
        // 修改表格if_authenticated状态，否则不需要动
        const newData = { if_authenticated: true };
        await models.InvitationCodes.update(newData, condition);
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } else {
    return false;
  }
};

export const authenticateReserveTransaction = async (account, models) => {
  if (!account) return;

  // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
  const recordNum = await models.SalpOverviews.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }

  const timeRecord = await models.SalpOverviews.findOne({});

  // 获取预约开始和结束时间
  const invitation_start_time_formatted = sequelize.fn(
    "to_timestamp",
    timeRecord.invitation_start_time
  );
  const invitation_end_time_formatted = sequelize.fn(
    "to_timestamp",
    timeRecord.invitation_end_time
  );

  let condition = {
    where: {
      $and: [
        { from: account },
        { to: MULTISIG_ACCOUNT },
        { time: { $gte: invitation_start_time_formatted } },
        { time: { $lte: invitation_end_time_formatted } },
      ],
    },
  };

  const rs = await models.Transactions.findAll(condition);

  if (rs.length == 0) {
    return false;
  } else {
    const contributionValue = getSumOfAFieldFromList(rs, "amount");
    if (contributionValue.isGreaterThanOrEqualTo(KSM_RESERVATION_AMOUNT)) {
      return true;
    } else {
      return false;
    }
  }
};

// *************************
// 获取个人符合条件，用于计算奖励的contributions。条件有如下几条：
// 1. 如果用户不在白名单内，正式开投时间 - 结束时间的 个人所有contributions都算进去
// 2. 如果用户在白名单内，提前开始时间 - 结束时间的 个人所有contributions都算进去

export const getRewardedPersonalContributions = async (account, models) => {
  if (!account) return;

  // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
  const recordNum = await models.SalpOverviews.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }

  const timeRecord = await models.SalpOverviews.findOne({});

  // 获取各种时间
  const whitelist_start_time_formatted = await sequelize.fn(
    "to_timestamp",
    timeRecord.salp_whitelist_start_time
  );

  const start_time_formatted = sequelize.fn(
    "to_timestamp",
    timeRecord.salp_start_time
  );
  const end_time_formatted = sequelize.fn(
    "to_timestamp",
    timeRecord.salp_end_time
  );

  let condition = {
    where: {
      $and: [
        { from: account },
        { to: MULTISIG_ACCOUNT },
        {
          time: {
            $lte: end_time_formatted,
          },
        },
      ],
    },
    raw: true,
    include: [
      {
        model: models.InvitationCodes,
      },
    ],
  };

  // 判断该账户是否已预约，根据预约的情况，从不同的时间开始计算参与奖励的contributions
  const ifReserved = await queryIfReserved(account, models);
  if (ifReserved) {
    condition.where["$and"].push({
      time: { $gte: whitelist_start_time_formatted },
    });
  } else {
    condition.where["$and"].push({
      time: { $gte: start_time_formatted },
    });
  }

  const rewardedPersonalContributionList = await models.Transactions.findAll(
    condition
  );

  if (rewardedPersonalContributionList.length == 0) {
    return {
      rewardedPersonalContributions: new BigNumber(0),
      rewardedPersonalContributionList: [],
    };
  }

  const rewardedPersonalContributions = getSumOfAFieldFromList(
    rewardedPersonalContributionList,
    "amount"
  );

  return { rewardedPersonalContributions, rewardedPersonalContributionList };
};
