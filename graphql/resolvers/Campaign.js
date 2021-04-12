import { campaignInfoInitialization } from "../utils/Common";

// GraphQL查询的resolver
const Campaign = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getCampaignInfo: async (parent, {}, { models }) => {
      // 查询如果没有数据，则读取.env文件，初始化salpOverview表格
      let recordNum = await models.SalpOverviews.count();
      if (recordNum == 0) {
        await campaignInfoInitialization(models);
      }

      let record = await models.SalpOverviews.findOne();

      return {
        targets: record.channel_target,
        multisigAccountCurrentBalance: record.multisig_account_balance,
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
