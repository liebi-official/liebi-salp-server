import {
  campaignInfoInitialization,
  getStringQueryList,
} from "../utils/Common";
import dotenv from "dotenv";
import BigNumber from "bignumber.js";
import { sequelize } from "../../server/models";
import { QueryTypes } from "sequelize";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT.split("|"); // 多签账户地址
const LIQUIDITY_RATE = 0.05;

const getMultisigAccountHistoricalBalance = async (models) => {
  // 只要是转账到多签账户的交易都计算入内
  let queryString = `WHERE "to" IN ${getStringQueryList(
    MULTISIG_ACCOUNT
  )} AND "from" NOT IN ${getStringQueryList(MULTISIG_ACCOUNT)}`;
  let result = await sequelize.query(
    `SELECT SUM(amount::bigint) FROM transactions ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  let multisigAccountHistoricalBalance = new BigNumber(0);
  if (result[0].sum) {
    multisigAccountHistoricalBalance = new BigNumber(result[0].sum);
  }

  const multisigVotes = new BigNumber(result[0].sum);
  const liquidity = multisigVotes.multipliedBy(LIQUIDITY_RATE);

  // 还需要添加官方crowdloan投票的金额。不含两个多签账户，不然就重复计算了
  queryString = `WHERE "para_id" = '2001' AND "account_id" NOT IN ${getStringQueryList(
    MULTISIG_ACCOUNT
  )}`;

  result = await sequelize.query(
    `SELECT SUM(balance_of::bigint) FROM contributeds ${queryString} `,
    { type: QueryTypes.SELECT }
  );

  if (result[0].sum) {
    multisigAccountHistoricalBalance = new BigNumber(result[0].sum).plus(
      multisigAccountHistoricalBalance
    );
  }

  // 总投票金额应为，crowdloan金额+投到多签账户的钱-5%多签账户的流动性
  const crowdloan = new BigNumber(result[0].sum)
    .plus(multisigVotes)
    .minus(liquidity);

  return {
    totalProgress: multisigAccountHistoricalBalance,
    crowdloan,
    liquidity,
  };
};

// GraphQL查询的resolver
const Campaign = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getCampaignInfo: async (parent, {}, { models }) => {
      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      const record = await models.SalpOverviews.findOne();

      // 获取所有参与预约的人数
      const condition = {
        distinct: true,
        col: "from",
        where: { to: MULTISIG_ACCOUNT[0] },
      };

      const votersNum = await models.Transactions.count(condition);

      // 获取所有在官方渠道参与正式投票的人数
      const condition1 = {
        distinct: true,
        col: "account_id",
        where: { para_id: "2001" },
      };

      const officialVotersNum1 = await models.Contributeds.count(condition1);

      // 获取所有在bifrost渠道参与竞拍的人数
      const condition2 = {
        distinct: true,
        col: "from",
        where: { to: MULTISIG_ACCOUNT[1] },
      };

      const officialVotersNum2 = await models.Transactions.count(condition2);

      const officialVotersNum = officialVotersNum1 + officialVotersNum2;

      return {
        targets: record.channel_target,
        votersNum,
        officialVotersNum,
      };
    },
    getFundingProgress: async (parent, {}, { models }) => {
      // 获取多签账户历史记录余额
      const result = await getMultisigAccountHistoricalBalance(models);

      return {
        totalProgress: result.totalProgress.toFixed(0),
        crowdloan: result.crowdloan.toFixed(0),
        liquidity: result.liquidity.toFixed(0),
      };
    },
    getTimetable: async (parent, {}, { models }) => {
      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      const record = await models.SalpOverviews.findOne();

      return {
        invitationStartTime: record.invitation_start_time,
        invitationEndTime: record.invitation_end_time,
        salpWhitelistStartTime: record.salp_whitelist_start_time,
        salpStartTime: record.salp_start_time,
        salpEndTime: record.salp_end_time,
        campaignStatus: record.campaign_status,
        serverTime: Math.round(new Date().getTime() / 1000),
      };
    },
    getCoefficients: async (parent, {}, { models }) => {
      // 确保Coefficients表有值
      let recordNum = await models.Coefficients.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.Coefficients.findOne({});

      return {
        straightRewardCoefficient: record.straight_reward_coefficient,
        successfulAuctionRewardCoefficient:
          record.successful_auction_reward_coefficient,
        royaltyCoefficient: record.royalty_coefficient,
      };
    },
    getAllContributionRecord: async (
      parent,
      { offset, recordNum },
      { models }
    ) => {
      const queryString = `WHERE "to" IN ${getStringQueryList(
        MULTISIG_ACCOUNT
      )} AND "from" NOT IN ${getStringQueryList(MULTISIG_ACCOUNT)}`;

      const queryString2 = `WHERE "para_id" = '2001' AND "account_id" NOT IN ${getStringQueryList(
        MULTISIG_ACCOUNT
      )}`;

      const result = await sequelize.query(
        `
        SELECT "account_id" "address", balance_of::text "amount", "time" FROM contributeds  ${queryString2} 
        UNION 
        SELECT "from" "address", amount::text, "time" FROM transactions ${queryString}
        ORDER BY "time" DESC 
        LIMIT ${recordNum}
        OFFSET ${(offset - 1) * recordNum}
          `,
        { type: QueryTypes.SELECT }
      );

      return result;
    },
    getAccumulatedContributionsSeries: async (parent, {}, { models }) => {
      const queryString = `WHERE "to" IN ${getStringQueryList(
        MULTISIG_ACCOUNT
      )} AND "from" NOT IN ${getStringQueryList(MULTISIG_ACCOUNT)}`;

      const queryString2 = `WHERE "para_id" = '2001' AND "account_id" NOT IN ${getStringQueryList(
        MULTISIG_ACCOUNT
      )}`;

      const recordQueryString = `
      SELECT balance_of::bigint "amount", "time" FROM contributeds  ${queryString2} 
      UNION 
      SELECT amount::bigint, "time" FROM transactions ${queryString}
      ORDER BY "time" DESC `

      const dataString = `SELECT date_trunc('hour', time) as "time", amount::bigint 
      FROM (${recordQueryString}) union_table`;

      const seriesString = `SELECT * FROM generate_series('2021-05-14 00:00'::timestamp,
      now(), '1 hours') as time`;

      const mainString = `SELECT time_table.time "time", SUM(data_table.amount::bigint) accumulated 
                          FROM (${seriesString}) as time_table 
                          LEFT JOIN (${dataString}) as data_table 
                          ON time_table.time = data_table.time
                          GROUP BY time_table.time
                          `;
      
      const cumulativeString = `SELECT time, SUM(accumulated) OVER
                                (ORDER BY time ASC rows between unbounded preceding and current row) accumulated 
                                FROM (${mainString}) as data`;

      const result = await sequelize.query(
        `${cumulativeString}`,
        { type: QueryTypes.SELECT }
      );

      return result;
    },
  },
};

module.exports = Campaign;
