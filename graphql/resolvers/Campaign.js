import dotenv from "dotenv";

// get data from the env config file
dotenv.config();
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
const campaignInfoInitialization = async (models) => {
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

  const initCoefficientData = {
    early_bird_coefficient: EARLY_BIRD_COEFFICIENT,
    early_bird_invitation_coefficient: EARLY_BIRD_INVITATION_COEFFICIENT,
    successful_auction_reward_coefficient: SUCCESSFUL_AUCTION_REWARD_COEFFICIENT,
    successful_auction_royalty_coefficient: SUCCESSFUL_AUCTION_ROYALTY_COEFFICIENT,
  };

  await models.Coefficients.create(initCoefficientData);
};

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
