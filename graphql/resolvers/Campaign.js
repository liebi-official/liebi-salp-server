import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { salpOverview } from "../../server/models";

dotenv.config();
const CAMPAIGN_NUM = parseInt(process.env.CAMPAIGN_NUM);

// GraphQL查询的resolver
const Campaign = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    getCampaignInfo: async (parent, {}, { models }) => {
      // fake data
      return {
        targets: "1000000",
        multisigAccountCurrentBalance: "20000",
        invitationStartTime: 1617700000,
        invitationEndTime: 1617760000,
        salpStartTime: 1617793345,
        salpEndTime: 1627793891,
        campaignStatus: "bidding",
      };
    },
  },
};

module.exports = Campaign;
