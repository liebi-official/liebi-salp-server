import {
  campaignInfoInitialization,
  getSumOfAFieldFromList,
} from "../utils/Common";
import dotenv from "dotenv";
import BigNumber from "bignumber.js";
dotenv.config();

const MULTISIG_ACCOUNT = process.env.MULTISIG_ACCOUNT; // 多签账户地址

const getMultisigAccountHistoricalBalance = async (models) => {
  // 只要是转账到多签账户的交易都计算入内
  const condition = {
    where: { to: MULTISIG_ACCOUNT },
    raw: true,
  };

  const historicalTransferList = await models.Transactions.findAll(condition);

  let multisigAccountHistoricalBalance = new BigNumber(0);

  if (historicalTransferList.length != 0) {
    multisigAccountHistoricalBalance = getSumOfAFieldFromList(
      historicalTransferList,
      "amount"
    );
  }

  return multisigAccountHistoricalBalance;
};

// GraphQL查询的resolver
const Campaign = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getCampaignProgress: async (parent, {}, { models }) => {
      // 查询如果没有数据，则读取.env文件，初始化salp_overview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      // 获取多签账户历史记录余额
      // const multisig_account_historical_balance = await getMultisigAccountHistoricalBalance(
      //   models
      // );

      const record = await models.SalpOverviews.findOne();

      // 获取所有参与投票的人数
      const condition = {
        distinct: true,
        col: "from"
      };

      const votersNum = await models.Transactions.count(condition);

      return {
        targets: record.channel_target,
        // multisigAccountHistoricalBalance: multisig_account_historical_balance.toFixed(
        //   0
        // ),
        multisigAccountHistoricalBalance: "0",
        votersNum
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
  },
};

module.exports = Campaign;
