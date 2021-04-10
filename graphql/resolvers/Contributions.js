import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { getRandomCombination } from "../utils/Common";

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
      let record = await models.InvitationCodes.findOne({
        where: { invitor_address: account },
      });

      if (record) {
        return {
          invitationCode: record.invitor_code,
          status: "existing",
        };
      } else {
        return {
          invitationCode: "",
          status: "none",
        };
      }
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
      // 检查账户是否已有邀请码
      let record = await models.InvitationCodes.findOne({
        where: { invitor_address: account },
      });

      // status值为"new", "existing", "none"中的一种
      if (record) {
        return {
          invitationCode: record.invitor_code,
          status: "existing",
        };
      }

      while (true) {
        let newInvitationCode = getRandomCombination();

        // 检查邀请码是否有重复
        let rs = await models.InvitationCodes.findOne({
          where: { invitor_code: newInvitationCode },
        });

        if (!rs) {
          await models.InvitationCodes.create({
            invitor_address: account,
            invitor_code: newInvitationCode,
          });
          break;
        }
      }

      let newRecord = await models.InvitationCodes.findOne({
        where: { invitor_address: account },
      });

      return {
        invitationCode: newRecord.invitor_code,
        status: "new",
      };
    },
  },
};

module.exports = Contributions;
