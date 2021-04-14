import {
  campaignInfoInitialization,
  getMultisigAccountHistoricalBalance,
} from "../utils/Common";

// GraphQL查询的resolver
const Campaign = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getCampaignInfo: async (parent, {}, { models }) => {
      // 查询如果没有数据，则读取.env文件，初始化salpOverview表格
      const recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      } else {
        const multisigAccountHistoricalBalance = await getMultisigAccountHistoricalBalance(
          models
        );

        let rs = await models.SalpOverviews.findOne();
        // 更新历史记录余额
        rs.multisig_account_historical_balance = multisigAccountHistoricalBalance.toFixed(
          0
        );
        await rs.save();
      }

      const record = await models.SalpOverviews.findOne();

      return {
        targets: record.channel_target,
        multisigAccountHistoricalBalance:
          record.multisig_account_historical_balance,
        invitationStartTime: record.invitation_start_time,
        invitationEndTime: record.invitation_end_time,
        salpStartTime: record.salp_start_time,
        salpEndTime: record.salp_end_time,
        campaignStatus: record.campaign_status,
      };
    },
  },
};

module.exports = Campaign;
