import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { sequelize } from "../../server/models";
import { QueryTypes } from "sequelize";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT.split("|"); // 多签账户地址列表
export const KSM_AUTHENTICATION_AMOUNT = 10000000000; // 1^11 = 0.1 KSM

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
const SALP_WHITELIST_AHEAD_HOURS = parseFloat(
  process.env.SALP_WHITELIST_AHEAD_HOURS
);
const SALP_START_TIME = parseInt(process.env.SALP_START_TIME);
const SALP_END_TIME = parseInt(process.env.SALP_END_TIME);
const SALP_TARGET = process.env.SALP_TARGET;
const STRAIGHT_REWARD_COEFFICIENT = parseFloat(
  process.env.STRAIGHT_REWARD_COEFFICIENT
);
const SUCCESSFUL_AUCTION_REWARD_COEFFICIENT = parseFloat(
  process.env.SUCCESSFUL_AUCTION_REWARD_COEFFICIENT
);
const ROYALTY_COEFFICIENT = parseFloat(process.env.ROYALTY_COEFFICIENT);

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
    straight_reward_coefficient: STRAIGHT_REWARD_COEFFICIENT,
    successful_auction_reward_coefficient: SUCCESSFUL_AUCTION_REWARD_COEFFICIENT,
    royalty_coefficient: ROYALTY_COEFFICIENT,
  };

  await models.Coefficients.create(initCoefficientData);
};

// *************************
// 获取个人contributions的总额
export const getPersonalContributions = async (account, models) => {
  if (!account) return;

  const queryString = `WHERE "from" = '${account}' AND "to" IN ${getStringQueryList(
    MULTISIG_ACCOUNT
  )}`;
  const result = await sequelize.query(
    `SELECT SUM(amount::bigint) FROM transactions ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  let personalContributions = new BigNumber(0);
  if (result[0].sum) {
    personalContributions = new BigNumber(result[0].sum);
  }

  return personalContributions;
};

// *************************
// 获取某账号下线的contributions的总额
export const getInvitationData = async (account, models) => {
  // 获取各种时间
  const timeRecord = await models.SalpOverviews.findOne({});

  // 分两批计算，第一批为预约过的被邀请人，第二批为未预约过的被邀请人。原因是两者的开始计算投票金额时间不一样，而且算预约奖励人头也不一样

  //第一批，已经预约过的被邀请人
  let condition = {
    where: { invited_by_address: account }, // 被邀请的账户，无论被邀请账户是否预约过，他的投票都算进去别人的邀请金额里面
    attributes: ["inviter_address"],
    raw: true, // 获取object array
  };

  let inviteeList = await models.InvitationCodes.findAll(condition);
  inviteeList = inviteeList.map((item) => {
    return item["inviter_address"];
  });

  let bondList = [];
  if (inviteeList.length != 0) {
    // 先排序，然后选每个人的最早的投票记录
    let bondListQueryString = `WHERE "to" IN ${getStringQueryList(
      MULTISIG_ACCOUNT
    )} AND "from" IN `;
    bondListQueryString += getStringQueryList(inviteeList);
    bondListQueryString += ` ORDER BY "from", "time" ASC`;

    const contributionList = await sequelize.query(
      `SELECT * FROM (SELECT DISTINCT on ("from") "from", "time" FROM transactions ${bondListQueryString}) first_time_table ORDER BY "time" DESC `,
      { type: QueryTypes.SELECT }
    );

    const invitationList = await sequelize.query(
      `SELECT inviter_address "from", created_at "time" FROM invitation_codes WHERE "invited_by_address" = 'account'`,
      { type: QueryTypes.SELECT }
    );

    const comprehensiveList = contributionList.concat(invitationList);

    // 去重
    let obj = {};
    let allList = comprehensiveList.reduce((all, next) => {
      obj[next.from] ? "" : (obj[next.from] = true && all.push(next));
      return all;
    }, []);

    bondList = allList.map((item) => {
      return {
        bondAddress: item.from,
        bondTime: item.time,
      };
    });
  }

  // 计算合总贡献额
  let queryString = null;
  let invitationContributions = new BigNumber(0);

  // 从开始预约的时间到salp结束的时间来算，涵盖所有预约投票金额和正式投票金额
  if (inviteeList.length > 0) {
    queryString = `WHERE "time" >= to_timestamp(${
      timeRecord.invitation_start_time
    }) AND \
    "time"  <= to_timestamp(${timeRecord.salp_end_time}) AND \
    "from" IN ${getStringQueryList(inviteeList)}
    `;
  }

  if (queryString) {
    const result = await sequelize.query(
      `SELECT SUM(amount::bigint) FROM transactions ${queryString} `,
      { type: QueryTypes.SELECT }
    );
    if (result[0].sum) {
      invitationContributions = new BigNumber(result[0].sum);
    }
  }

  // 查出accountInvitationList，即符合时间条件的下线的交易列表
  let accountInvitationList = [];
  if (queryString) {
    accountInvitationList = await sequelize.query(
      `SELECT "from", "amount", "time" FROM transactions ${queryString} `,
      { type: QueryTypes.SELECT }
    );
  }

  return {
    numberOfInvitees: inviteeList.length,
    invitationContributions,
    bondList: bondList,
    accountInvitationList,
  };
};

// *************************
// 查询用户是是预约名单内的成员。
export const queryIfReserved = async (account, models) => {
  const condition = { where: { inviter_address: account } };
  const rs = await models.InvitationCodes.findOne(condition);

  if (rs && rs.if_reserved) {
    return true;
  } else {
    return false;
  }
};

// *************************
// 查询用户是否激活了邀请码。激活邀请码有两个条件，第1是有邀请码记录。第2是if_authenticated是true的状态。
export const queryIfAuthenticated = async (account, models) => {
  const condition = {
    where: {
      $and: [{ inviter_address: account }, { inviter_code: { $not: null } }],
    },
  };
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
  const timeRecord = await models.SalpOverviews.findOne({});

  // 转账至多签账户，获取预约开始和SALP结束时间
  const queryString1 = `WHERE "from" = '${account}' AND \
                             "to" IN ${getStringQueryList(
                               MULTISIG_ACCOUNT
                             )} AND \
                             "time" >= to_timestamp(${
                               timeRecord.invitation_start_time
                             }) AND \
                             "time"  <= to_timestamp(${
                               timeRecord.salp_end_time
                             })
                             `;

  const result1 = await sequelize.query(
    `SELECT SUM(amount::bigint) FROM transactions ${queryString1} `,
    { type: QueryTypes.SELECT }
  );

  // 计算在官网投票的personalContributions
  const queryString2 = `WHERE "para_id" = '2001' AND "account_id" = '${account}'`;
  const result2 = await sequelize.query(
    `SELECT SUM(balance_of::bigint) FROM contributeds ${queryString2} `,
    { type: QueryTypes.SELECT }
  );

  let sum1 = result1[0].sum ? new BigNumber(result1[0].sum) : new BigNumber(0);
  let sum2 = result2[0].sum ? new BigNumber(result2[0].sum) : new BigNumber(0);
  let contributionValue = sum1.plus(sum2);

  if (contributionValue.isGreaterThanOrEqualTo(KSM_AUTHENTICATION_AMOUNT)) {
    return true;
  } else {
    return false;
  }
};

// *************************
// 获取个人符合条件，用于计算奖励的contributions。条件有如下几条：
// 1. 如果用户不在白名单内，正式开投时间 - 结束时间的 个人所有contributions都算进去
// 2. 如果用户在白名单内，提前开始时间 - 结束时间的 个人所有contributions都算进去

export const getRewardedPersonalContributions = async (account, models) => {
  const timeRecord = await models.SalpOverviews.findOne({});

  let queryString = `WHERE "from" = '${account}' AND \
                              "to" IN ${getStringQueryList(
                                MULTISIG_ACCOUNT
                              )} AND \
                              "time"  <= to_timestamp(${
                                timeRecord.salp_end_time
                              }) AND \
                              "time" >= to_timestamp(${
                                timeRecord.invitation_start_time
                              })
                              `;

  const result = await sequelize.query(
    `SELECT SUM(amount::bigint) FROM transactions ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  let rewardedPersonalContributions = new BigNumber(0);
  if (result[0].sum) {
    rewardedPersonalContributions = new BigNumber(result[0].sum);
  }

  return rewardedPersonalContributions;
};

// **************************************
// 从一个字符串数组获取查询的where in语句字符串
export const getStringQueryList = (stringList) => {
  if (stringList.length == 0) {
    return "";
  }

  let queryString = "(";
  let i;
  for (i = 0; i < stringList.length - 1; i++) {
    queryString += `'${stringList[i]}',`;
  }
  queryString += `'${stringList[i]}')`;

  return queryString;
};

// **************************************
// 下面是为了SALP励两条渠道相加而封装的代码
export const calculateExtendedInvitingReward = async (account, models) => {
  // 确保Coefficients表有值
  let recordNum = await models.Coefficients.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }
  let record = await models.Coefficients.findOne();

  // 计算奖励基础
  let inviteesQueryString = `SELECT inviter_address FROM invitation_codes WHERE "invited_by_address" = '${account}'`;
  let queryString = `WHERE "para_id" = '2001' AND "account_id" IN (${inviteesQueryString})`;

  const result = await sequelize.query(
    `SELECT SUM(balance_of::bigint) FROM contributeds ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  let invitationContributions = new BigNumber(0);
  if (result[0].sum) {
    invitationContributions = result[0].sum;
  }

  const invitationStraightReward = new BigNumber(
    record.straight_reward_coefficient
  )
    .multipliedBy(record.royalty_coefficient)
    .multipliedBy(invitationContributions);

  const successfulAuctionRoyalty = new BigNumber(record.royalty_coefficient)
    .multipliedBy(record.successful_auction_reward_coefficient)
    .multipliedBy(invitationContributions);

  return {
    invitationContributions,
    invitationStraightReward,
    successfulAuctionRoyalty,
  };
};

export const calculateExtendedSelfReward = async (account, models) => {
  // 确保Coefficients表有值
  let recordNum = await models.Coefficients.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }

  let record = await models.Coefficients.findOne();

  // 计算在官网投票的personalContributions
  const queryString = `WHERE "para_id" = '2001' AND "account_id" = '${account}'`;
  const result = await sequelize.query(
    `SELECT SUM(balance_of::bigint) FROM contributeds ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  let rewardedPersonalContributions = new BigNumber(0);
  if (result[0].sum) {
    rewardedPersonalContributions = new BigNumber(result[0].sum);
  }

  // 计算各种奖励
  const straightReward = new BigNumber(
    record.straight_reward_coefficient
  ).multipliedBy(rewardedPersonalContributions);

  const successfulAuctionReward = new BigNumber(
    record.successful_auction_reward_coefficient
  ).multipliedBy(rewardedPersonalContributions);

  // 如果该用户绑定了邀请人，则可获得额外的10%奖励
  let codeExtraInstantReward = new BigNumber(0);

  // 看是否在表里，在表里就是绑定过邀请码的
  const condition = {
    where: {
      $and: [
        { inviter_address: account },
        { invited_by_address: { $not: null } },
      ],
    },
    raw: true, // 获取object array
  };

  const recordCount = await models.InvitationCodes.count(condition);

  if (recordCount != 0) {
    // 也是获得应得即时奖励金额的10%，与邀请人获得的邀请奖励是一样的
    codeExtraInstantReward = straightReward.multipliedBy(
      record.royalty_coefficient
    );
  }

  return {
    rewardedPersonalContributions,
    straightReward,
    codeExtraInstantReward,
    successfulAuctionReward,
  };
};

export const calculateSelfReward = async (account, models) => {
  // 确保Coefficients表有值
  let recordNum = await models.Coefficients.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }

  let record = await models.Coefficients.findOne();

  // 查询个人的contribution，可用于展示vsKSM有多少
  const personalContributions = await getPersonalContributions(account, models);

  // 查询个人的符合奖励条件contribution，并计算相应的竞拍成功奖励
  const rewardedPersonalContributions = await getRewardedPersonalContributions(
    account,
    models
  );

  let straightReward = new BigNumber(
    record.straight_reward_coefficient
  ).multipliedBy(rewardedPersonalContributions);

  // 如果用户是已预约成功的用户，则可获得额外的 50000/43720=1143641354071 个BNC的空投
  const airdropCondition = { where: { inviter_address: account } };
  const rs = await models.InvitationCodes.findOne(airdropCondition);

  if (rs && rs.if_reserved == true) {
    straightReward = straightReward.plus(new BigNumber(1143641354071));
  }

  const successfulAuctionReward = new BigNumber(
    record.successful_auction_reward_coefficient
  ).multipliedBy(rewardedPersonalContributions);

  // 如果该用户绑定了邀请人，则可获得额外的10%奖励
  let codeExtraInstantReward = new BigNumber(0);

  // 看是否在表里，在表里就是绑定过邀请码的
  const condition = {
    where: {
      $and: [
        { inviter_address: account },
        { invited_by_address: { $not: null } },
      ],
    },
    raw: true, // 获取object array
  };

  const recordCount = await models.InvitationCodes.count(condition);

  if (recordCount != 0) {
    // 也是获得应得即时奖励金额的10%，与邀请人获得的邀请奖励是一样的
    codeExtraInstantReward = straightReward.multipliedBy(
      record.royalty_coefficient
    );
  }

  return {
    personalContributions,
    rewardedPersonalContributions,
    straightReward,
    codeExtraInstantReward,
    successfulAuctionReward,
  };
};

export const calculateInvitingReward = async (account, models) => {
  // 确保Coefficients表有值
  let recordNum = await models.Coefficients.count();
  if (recordNum == 0) {
    await campaignInfoInitialization(models);
  }

  let record = await models.Coefficients.findOne();

  // 查询下线的人头数及总contributions金额
  const {
    bondList,
    numberOfInvitees,
    invitationContributions,
  } = await getInvitationData(account, models);

  const invitationStraightReward = new BigNumber(
    record.straight_reward_coefficient
  )
    .multipliedBy(record.royalty_coefficient)
    .multipliedBy(invitationContributions);

  const successfulAuctionRoyalty = new BigNumber(record.royalty_coefficient)
    .multipliedBy(record.successful_auction_reward_coefficient)
    .multipliedBy(invitationContributions);

  return {
    invitationContributions,
    numberOfInvitees: numberOfInvitees,
    bondList: bondList,
    invitationStraightReward,
    successfulAuctionRoyalty,
  };
};
