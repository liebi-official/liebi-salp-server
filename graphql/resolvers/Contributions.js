import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { AddressBinder, CampaignInfo } from "../../server/models";

dotenv.config();
const CAMPAIGN_NUM = parseInt(process.env.CAMPAIGN_NUM);

// GraphQL查询的resolver
const Contributions = {
  // ===========================================================================
  // ? QUERIES
  // ===========================================================================
  Query: {
    earlyBirdData: async (parent, { account }, { models }) => {
      // fake data
      return {
        personalContributions: "1000000",
        earlyBirdBonus: "5000",
        numberOfInvitation: 29,
        invitationContributions: "2800000",
        earlyBirdInvitationBonus: "900",
      };
    },
    successfulAuctionRewardData: async (parent, { account }, { models }) => {
      // fake data
      return {
        personalContributions: "4000000",
        successfulAuctionReward: "7000",
        numberOfInvitation: 44,
        invitationContributions: "6600000",
        successfulAuctionRoyalty: "8300",
      };
    },
    getInvitationCode: async (parent, { account }, { models }) => {
      // fake data
      return {
        invitationCode: "AA0000",
        status: "existing",
      };
    },
    getContributions: async (
      parent,
      { contributorAccount, inviterAccount, recordNum },
      { models }
    ) => {
      // fake data
      return {
        totalContributions: "5555555",
        contributions: [
          {
            contributorAddress: "aaaaaaaaa",
            amount: "4444444",
            timestamp: 1617793345,
            inviterAddress: "bbbbbbbb",
          },
          {
            contributorAddress: "bbbbbbbb",
            amount: "1111111",
            timestamp: 1617793388,
            inviterAddress: "cccccccc",
          },
        ],
      };
    },
  },

  // =============================================================================
  //? MUTATIONS
  // =============================================================================
  Mutation: {
    generateInvitationCode: async (parent, { account }, { models }) => {
      // fake data
      return {
        invitationCode: "AA1111",
        status: "new",
      };
    },
  },
};

module.exports = Contributions;
